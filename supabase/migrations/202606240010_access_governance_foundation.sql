-- CM-4: Access governance foundation.
-- This migration normalizes department roles and adds a database-driven permission catalogue.

-- ==================================================
-- 1. Department role normalization
-- ==================================================

update public.volunteer_department_memberships
set department_role = case department_role
  when 'coordinator' then 'deputy_head'
  when 'volunteer' then 'executive'
  else department_role
end
where department_role in ('coordinator', 'volunteer');

update public.department_membership_history
set
  previous_role = case previous_role
    when 'coordinator' then 'deputy_head'
    when 'volunteer' then 'executive'
    else previous_role
  end,
  new_role = case new_role
    when 'coordinator' then 'deputy_head'
    when 'volunteer' then 'executive'
    else new_role
  end
where previous_role in ('coordinator', 'volunteer')
   or new_role in ('coordinator', 'volunteer');

alter table public.volunteer_department_memberships
  drop constraint if exists volunteer_department_memberships_role_check;

alter table public.volunteer_department_memberships
  add constraint volunteer_department_memberships_role_check
  check (department_role in ('executive', 'deputy_head', 'department_head'));

alter table public.department_membership_history
  drop constraint if exists department_membership_history_role_check;

alter table public.department_membership_history
  add constraint department_membership_history_role_check
  check (
    (previous_role is null or previous_role in ('executive', 'deputy_head', 'department_head'))
    and (new_role is null or new_role in ('executive', 'deputy_head', 'department_head'))
  );

create unique index if not exists volunteer_department_memberships_one_active_head_idx
on public.volunteer_department_memberships (department_id)
where department_role = 'department_head'
  and membership_status = 'approved'
  and removed_at is null;

create unique index if not exists volunteer_department_memberships_one_active_deputy_idx
on public.volunteer_department_memberships (department_id)
where department_role = 'deputy_head'
  and membership_status = 'approved'
  and removed_at is null;

-- Keep the existing onboarding RPC current with the new role language.
create or replace function public.submit_volunteer_onboarding(
  p_full_name text,
  p_student_id text,
  p_email text,
  p_phone text,
  p_academic_department text,
  p_trimester text,
  p_blood_group text,
  p_preferred_department_id uuid
)
returns table (
  volunteer_profile_id uuid,
  department_membership_id uuid,
  onboarding_status text,
  membership_status text
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_auth_user_id uuid := auth.uid();
  v_auth_email text := lower(nullif(btrim(auth.jwt() ->> 'email'), ''));
  v_profile public.volunteer_profiles%rowtype;
  v_membership public.volunteer_department_memberships%rowtype;
  v_existing_same_department uuid;
begin
  if v_auth_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if v_auth_email is null or v_auth_email <> lower(btrim(p_email)) then
    raise exception 'Email must match authenticated account' using errcode = '42501';
  end if;

  if p_preferred_department_id is not null and not exists (
    select 1 from public.club_departments
    where id = p_preferred_department_id
      and status = 'active'
      and archived_at is null
  ) then
    raise exception 'Invalid department' using errcode = '22023';
  end if;

  select * into v_profile
  from public.volunteer_profiles
  where auth_user_id = v_auth_user_id
  for update;

  if found then
    if v_profile.account_status in ('suspended', 'archived') then
      raise exception 'Profile is not eligible for onboarding update' using errcode = '42501';
    end if;

    update public.volunteer_profiles
    set
      full_name = btrim(p_full_name),
      student_id = nullif(btrim(p_student_id), ''),
      student_id_normalized = lower(regexp_replace(nullif(btrim(p_student_id), ''), '\s+', '', 'g')),
      email = lower(btrim(p_email)),
      email_normalized = lower(btrim(p_email)),
      phone = nullif(btrim(p_phone), ''),
      phone_normalized = regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g'),
      academic_department = nullif(btrim(p_academic_department), ''),
      trimester = nullif(btrim(p_trimester), ''),
      blood_group = nullif(btrim(p_blood_group), ''),
      onboarding_status = 'submitted',
      submitted_at = coalesce(submitted_at, now())
    where id = v_profile.id
    returning * into v_profile;
  else
    insert into public.volunteer_profiles (
      auth_user_id,
      full_name,
      student_id,
      student_id_normalized,
      email,
      email_normalized,
      phone,
      phone_normalized,
      academic_department,
      trimester,
      blood_group,
      account_status,
      onboarding_status,
      submitted_at
    )
    values (
      v_auth_user_id,
      btrim(p_full_name),
      nullif(btrim(p_student_id), ''),
      lower(regexp_replace(nullif(btrim(p_student_id), ''), '\s+', '', 'g')),
      lower(btrim(p_email)),
      lower(btrim(p_email)),
      nullif(btrim(p_phone), ''),
      regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g'),
      nullif(btrim(p_academic_department), ''),
      nullif(btrim(p_trimester), ''),
      nullif(btrim(p_blood_group), ''),
      'pending',
      'submitted',
      now()
    )
    returning * into v_profile;
  end if;

  if p_preferred_department_id is null then
    return query select v_profile.id, null::uuid, v_profile.onboarding_status, null::text;
    return;
  end if;

  select id into v_existing_same_department
  from public.volunteer_department_memberships
  where volunteer_profile_id = v_profile.id
    and department_id = p_preferred_department_id
  for update;

  if v_existing_same_department is not null then
    update public.volunteer_department_memberships
    set
      membership_status = case
        when membership_status in ('rejected', 'removed') then 'requested'
        else membership_status
      end,
      department_role = 'executive',
      requested_at = coalesce(requested_at, now()),
      rejection_reason = null,
      removed_at = null,
      removed_by = null,
      removal_reason = null
    where id = v_existing_same_department
    returning * into v_membership;
  else
    insert into public.volunteer_department_memberships (
      volunteer_profile_id,
      department_id,
      department_role,
      membership_status,
      is_primary,
      requested_at
    )
    values (
      v_profile.id,
      p_preferred_department_id,
      'executive',
      'requested',
      not exists (
        select 1 from public.volunteer_department_memberships
        where volunteer_profile_id = v_profile.id
      ),
      now()
    )
    returning * into v_membership;
  end if;

  return query select v_profile.id, v_membership.id, v_profile.onboarding_status, v_membership.membership_status;
end;
$$;

-- ==================================================
-- 2. Permission catalogue and policy tables
-- ==================================================

create table if not exists public.system_permissions (
  id uuid primary key default extensions.gen_random_uuid(),
  permission_key text not null unique,
  module_key text not null,
  name text not null,
  description text,
  risk_level text not null default 'normal',
  supports_global_scope boolean not null default false,
  supports_department_scope boolean not null default false,
  supports_event_scope boolean not null default false,
  supports_record_scope boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint system_permissions_key_check check (permission_key ~ '^[a-z0-9_]+(\.[a-z0-9_]+)+$'),
  constraint system_permissions_risk_check check (risk_level in ('normal', 'elevated', 'sensitive', 'critical'))
);

create table if not exists public.platform_role_permission_policies (
  id uuid primary key default extensions.gen_random_uuid(),
  platform_role text not null,
  permission_id uuid not null references public.system_permissions(id) on delete restrict,
  effect text not null,
  scope_rule text not null default 'global',
  requires_approval boolean not null default false,
  approval_policy_key text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_role_permission_effect_check check (effect in ('allow', 'deny')),
  constraint platform_role_permission_scope_check check (scope_rule in ('global', 'own_department', 'assigned_event', 'own_record')),
  constraint platform_role_permission_role_check check (platform_role in ('super_admin', 'club_admin', 'membership_admin', 'content_admin', 'department_admin'))
);

create table if not exists public.club_position_permission_policies (
  id uuid primary key default extensions.gen_random_uuid(),
  club_position_slug text not null,
  permission_id uuid not null references public.system_permissions(id) on delete restrict,
  effect text not null,
  scope_rule text not null default 'global',
  requires_approval boolean not null default false,
  approval_policy_key text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint club_position_permission_effect_check check (effect in ('allow', 'deny')),
  constraint club_position_permission_scope_check check (scope_rule in ('global', 'own_department', 'assigned_event', 'own_record'))
);

create table if not exists public.department_role_permission_policies (
  id uuid primary key default extensions.gen_random_uuid(),
  department_role text not null,
  permission_id uuid not null references public.system_permissions(id) on delete restrict,
  effect text not null,
  scope_rule text not null default 'own_department',
  requires_approval boolean not null default false,
  approval_policy_key text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint department_role_permission_effect_check check (effect in ('allow', 'deny')),
  constraint department_role_permission_scope_check check (scope_rule in ('own_department', 'assigned_event', 'own_record')),
  constraint department_role_permission_role_check check (department_role in ('executive', 'deputy_head', 'department_head'))
);

create unique index if not exists platform_role_permission_unique_idx
on public.platform_role_permission_policies (platform_role, permission_id, scope_rule)
where is_active = true;

create unique index if not exists club_position_permission_unique_idx
on public.club_position_permission_policies (club_position_slug, permission_id, scope_rule)
where is_active = true;

create unique index if not exists department_role_permission_unique_idx
on public.department_role_permission_policies (department_role, permission_id, scope_rule)
where is_active = true;

create index if not exists system_permissions_module_idx on public.system_permissions (module_key);
create index if not exists system_permissions_risk_idx on public.system_permissions (risk_level);

drop trigger if exists set_system_permissions_updated_at on public.system_permissions;
create trigger set_system_permissions_updated_at
before update on public.system_permissions
for each row execute function public.set_updated_at();

drop trigger if exists set_platform_role_permission_policies_updated_at on public.platform_role_permission_policies;
create trigger set_platform_role_permission_policies_updated_at
before update on public.platform_role_permission_policies
for each row execute function public.set_updated_at();

drop trigger if exists set_club_position_permission_policies_updated_at on public.club_position_permission_policies;
create trigger set_club_position_permission_policies_updated_at
before update on public.club_position_permission_policies
for each row execute function public.set_updated_at();

drop trigger if exists set_department_role_permission_policies_updated_at on public.department_role_permission_policies;
create trigger set_department_role_permission_policies_updated_at
before update on public.department_role_permission_policies
for each row execute function public.set_updated_at();

insert into public.system_permissions (
  permission_key,
  module_key,
  name,
  description,
  risk_level,
  supports_global_scope,
  supports_department_scope,
  supports_event_scope,
  supports_record_scope
)
values
  ('members.view', 'members', 'View members', 'View approved and pending volunteer profiles according to scope.', 'normal', true, true, false, true),
  ('members.review', 'members', 'Review members', 'Review ordinary member onboarding and membership records.', 'elevated', true, true, false, true),
  ('members.update', 'members', 'Update members', 'Update non-critical member profile state through controlled actions.', 'elevated', true, true, false, true),
  ('members.suspend', 'members', 'Suspend members', 'Suspend an ordinary volunteer profile.', 'sensitive', true, false, false, true),
  ('members.archive', 'members', 'Archive members', 'Archive an ordinary volunteer profile.', 'sensitive', true, false, false, true),
  ('members.manage_department_membership', 'members', 'Manage department membership', 'Approve, change, suspend, or remove department membership according to scope.', 'sensitive', true, true, false, true),
  ('positions.view', 'leadership', 'View official positions', 'View official club position definitions and assignments.', 'normal', true, false, false, false),
  ('positions.assign', 'leadership', 'Assign official positions', 'Assign official club positions through controlled actions.', 'sensitive', true, false, false, true),
  ('positions.complete', 'leadership', 'Complete official positions', 'Complete an official club position assignment.', 'sensitive', true, false, false, true),
  ('positions.revoke', 'leadership', 'Revoke official positions', 'Revoke an official club position assignment.', 'sensitive', true, false, false, true),
  ('departments.view', 'departments', 'View departments', 'View department structure and memberships according to scope.', 'normal', true, true, false, false),
  ('departments.manage', 'departments', 'Manage departments', 'Manage department records.', 'sensitive', true, false, false, true),
  ('departments.manage_own', 'departments', 'Manage own department', 'Manage permitted own-department operations.', 'elevated', false, true, false, false),
  ('departments.assign_head', 'departments', 'Assign Department Head', 'Assign or replace Department Head.', 'sensitive', true, true, false, true),
  ('departments.assign_deputy', 'departments', 'Assign Deputy Head', 'Assign or replace Deputy Head.', 'sensitive', true, true, false, true),
  ('departments.manage_executives', 'departments', 'Manage Executives', 'Manage Executive memberships within scope.', 'elevated', false, true, false, true),
  ('departments.archive', 'departments', 'Archive departments', 'Archive a department through controlled workflow.', 'critical', true, false, false, true),
  ('platform_roles.view', 'platform_access', 'View platform roles', 'View platform role assignments.', 'sensitive', true, false, false, false),
  ('platform_roles.assign', 'platform_access', 'Assign platform roles', 'Assign non-Super-Admin platform roles.', 'critical', true, false, false, true),
  ('platform_roles.revoke', 'platform_access', 'Revoke platform roles', 'Revoke non-Super-Admin platform roles.', 'critical', true, false, false, true),
  ('access_grants.view', 'platform_access', 'View access grants', 'View temporary access grants and restrictions.', 'sensitive', true, true, true, true),
  ('access_grants.manage', 'platform_access', 'Manage access grants', 'Grant or revoke temporary access according to policy.', 'critical', true, true, true, true),
  ('approval_requests.create', 'approvals', 'Create approval requests', 'Create maker-checker approval requests.', 'normal', true, true, true, true),
  ('approval_requests.review', 'approvals', 'Review approval requests', 'Approve or reject approval requests.', 'sensitive', true, true, true, true),
  ('approval_requests.override', 'approvals', 'Override approval requests', 'Emergency override approval requests with reason.', 'critical', true, true, true, true),
  ('staff_invitations.view', 'staff_invitations', 'View staff invitations', 'View operator-assisted staff invitation plans.', 'sensitive', true, false, false, true),
  ('staff_invitations.create', 'staff_invitations', 'Create staff invitations', 'Create operator-assisted staff invitation records.', 'sensitive', true, false, false, true),
  ('staff_invitations.cancel', 'staff_invitations', 'Cancel staff invitations', 'Cancel unaccepted staff invitation records.', 'sensitive', true, false, false, true),
  ('staff_invitations.review', 'staff_invitations', 'Review staff invitations', 'Review invitation plans during account approval.', 'sensitive', true, false, false, true),
  ('content.view', 'content', 'View content operations', 'View internal content operations.', 'normal', true, false, false, false),
  ('content.manage', 'content', 'Manage content', 'Manage website content according to policy.', 'elevated', true, false, false, true),
  ('events.view_internal', 'events', 'View internal events', 'View internal event planning information.', 'normal', true, true, true, false),
  ('events.create', 'events', 'Create events', 'Create event drafts in a future event module.', 'elevated', true, true, false, false),
  ('events.update', 'events', 'Update events', 'Update event records in a future event module.', 'elevated', true, true, true, true),
  ('events.publish', 'events', 'Publish events', 'Publish events in a future event module.', 'sensitive', true, false, true, true),
  ('events.cancel', 'events', 'Cancel events', 'Cancel approved or published events in a future event module.', 'sensitive', true, false, true, true),
  ('events.assign_departments', 'events', 'Assign event departments', 'Assign departments to event work in a future event module.', 'elevated', true, true, true, true),
  ('tasks.view', 'tasks', 'View tasks', 'View assigned or scoped tasks in a future task module.', 'normal', true, true, true, true),
  ('tasks.create', 'tasks', 'Create tasks', 'Create scoped tasks in a future task module.', 'elevated', true, true, true, false),
  ('tasks.assign', 'tasks', 'Assign tasks', 'Assign scoped tasks in a future task module.', 'elevated', true, true, true, true),
  ('tasks.update_own', 'tasks', 'Update own tasks', 'Update own assigned task progress in a future task module.', 'normal', false, true, true, true),
  ('tasks.review', 'tasks', 'Review tasks', 'Review submitted task work in a future task module.', 'elevated', true, true, true, true),
  ('tasks.close', 'tasks', 'Close tasks', 'Close scoped tasks in a future task module.', 'elevated', true, true, true, true),
  ('audit.view_operational', 'audit', 'View operational audit', 'View operational audit events.', 'sensitive', true, true, false, false),
  ('audit.view_security', 'audit', 'View security audit', 'View security-relevant audit events.', 'critical', true, false, false, false),
  ('blood.operations.view', 'blood', 'View Blood operations', 'View Blood Support operational records through BB-1 policies.', 'sensitive', true, true, false, true),
  ('blood.operations.manage', 'blood', 'Manage Blood operations', 'Manage Blood Support workflow through BB-1 RPCs.', 'sensitive', true, true, false, true),
  ('blood.settings.manage', 'blood', 'Manage Blood settings', 'Manage Blood Support settings through BB-1 RPCs.', 'critical', true, true, false, true)
on conflict (permission_key) do update set
  module_key = excluded.module_key,
  name = excluded.name,
  description = excluded.description,
  risk_level = excluded.risk_level,
  supports_global_scope = excluded.supports_global_scope,
  supports_department_scope = excluded.supports_department_scope,
  supports_event_scope = excluded.supports_event_scope,
  supports_record_scope = excluded.supports_record_scope,
  is_active = true;

insert into public.platform_role_permission_policies (platform_role, permission_id, effect, scope_rule, requires_approval, approval_policy_key)
select 'club_admin', id, 'allow', 'global', risk_level in ('sensitive', 'critical'), 'president_review'
from public.system_permissions
where permission_key in (
  'members.view', 'members.review', 'members.update', 'members.manage_department_membership',
  'positions.view', 'positions.assign', 'positions.complete', 'positions.revoke',
  'departments.view', 'departments.manage', 'departments.assign_head', 'departments.assign_deputy', 'departments.manage_executives',
  'access_grants.view', 'approval_requests.create', 'approval_requests.review',
  'staff_invitations.view', 'staff_invitations.create', 'staff_invitations.cancel', 'staff_invitations.review',
  'content.view', 'content.manage', 'events.view_internal', 'events.create', 'events.update', 'events.publish', 'events.assign_departments',
  'tasks.view', 'tasks.create', 'tasks.assign', 'tasks.review', 'tasks.close', 'audit.view_operational'
)
on conflict do nothing;

insert into public.platform_role_permission_policies (platform_role, permission_id, effect, scope_rule)
select 'membership_admin', id, 'allow', 'global'
from public.system_permissions
where permission_key in ('members.view', 'members.review', 'members.update', 'members.manage_department_membership')
on conflict do nothing;

insert into public.platform_role_permission_policies (platform_role, permission_id, effect, scope_rule)
select 'content_admin', id, 'allow', 'global'
from public.system_permissions
where permission_key in ('content.view', 'content.manage', 'events.view_internal', 'events.create', 'events.update')
on conflict do nothing;

insert into public.platform_role_permission_policies (platform_role, permission_id, effect, scope_rule)
select 'department_admin', id, 'allow', 'global'
from public.system_permissions
where permission_key in ('departments.view', 'departments.manage', 'departments.manage_executives', 'members.view', 'members.manage_department_membership')
on conflict do nothing;

insert into public.club_position_permission_policies (club_position_slug, permission_id, effect, scope_rule, requires_approval, approval_policy_key)
select slug, permission_id, effect, scope_rule, requires_approval, approval_policy_key
from (
  select 'president'::text as slug, sp.id as permission_id, 'allow'::text as effect, 'global'::text as scope_rule, false as requires_approval, null::text as approval_policy_key
  from public.system_permissions sp
  where sp.permission_key in ('approval_requests.review', 'members.view', 'members.review', 'members.update', 'departments.view', 'departments.manage', 'access_grants.view', 'staff_invitations.view', 'content.view', 'content.manage', 'events.view_internal', 'audit.view_operational')
  union all
  select 'vice-president', sp.id, 'allow', 'global', sp.risk_level in ('sensitive', 'critical'), 'president_review'
  from public.system_permissions sp
  where sp.permission_key in ('approval_requests.create', 'members.view', 'members.review', 'departments.view', 'content.view', 'content.manage', 'events.view_internal', 'events.create', 'events.update', 'tasks.view', 'tasks.create')
  union all
  select 'general-secretary', sp.id, 'allow', 'global', sp.risk_level in ('sensitive', 'critical'), 'president_review'
  from public.system_permissions sp
  where sp.permission_key in ('approval_requests.create', 'members.view', 'members.review', 'departments.view', 'content.view', 'content.manage', 'events.view_internal', 'events.create', 'events.update', 'tasks.view', 'tasks.create')
  union all
  select 'joint-secretary', sp.id, 'allow', 'global', false, null
  from public.system_permissions sp
  where sp.permission_key in ('approval_requests.create', 'members.view', 'departments.view', 'events.view_internal', 'tasks.view')
  union all
  select 'organizing-secretary', sp.id, 'allow', 'global', false, null
  from public.system_permissions sp
  where sp.permission_key in ('approval_requests.create', 'events.view_internal', 'events.create', 'tasks.view', 'tasks.create')
  union all
  select 'executive-member', sp.id, 'allow', 'assigned_event', false, null
  from public.system_permissions sp
  where sp.permission_key in ('events.view_internal', 'tasks.view', 'tasks.update_own')
) seeded
on conflict do nothing;

insert into public.department_role_permission_policies (department_role, permission_id, effect, scope_rule, requires_approval, approval_policy_key)
select role_name, permission_id, effect, scope_rule, requires_approval, approval_policy_key
from (
  select 'department_head'::text as role_name, sp.id as permission_id, 'allow'::text as effect, 'own_department'::text as scope_rule, false as requires_approval, null::text as approval_policy_key
  from public.system_permissions sp
  where sp.permission_key in ('departments.view', 'departments.manage_own', 'departments.manage_executives', 'members.view', 'events.view_internal', 'tasks.view', 'tasks.create', 'tasks.assign', 'tasks.review')
  union all
  select 'deputy_head', sp.id, 'allow', 'own_department', false, null
  from public.system_permissions sp
  where sp.permission_key in ('departments.view', 'departments.manage_own', 'members.view', 'events.view_internal', 'tasks.view', 'tasks.assign', 'tasks.review')
  union all
  select 'executive', sp.id, 'allow', 'own_department', false, null
  from public.system_permissions sp
  where sp.permission_key in ('departments.view', 'events.view_internal', 'tasks.view', 'tasks.update_own')
) seeded
on conflict do nothing;

-- ==================================================
-- 3. Authorization helpers
-- ==================================================

create or replace function public.has_active_department_role(target_department_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.volunteer_department_memberships vdm
    join public.volunteer_profiles vp on vp.id = vdm.volunteer_profile_id
    join public.club_departments cd on cd.id = vdm.department_id
    where vp.auth_user_id = auth.uid()
      and vp.account_status = 'approved'
      and vp.onboarding_status = 'approved'
      and vp.archived_at is null
      and vdm.department_id = target_department_id
      and vdm.department_role = any(allowed_roles)
      and vdm.membership_status = 'approved'
      and cd.status = 'active'
      and cd.archived_at is null
  )
$$;

create or replace function public.has_active_position(position_slug text)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.volunteer_club_positions vcp
    join public.club_positions cp on cp.id = vcp.club_position_id
    join public.volunteer_profiles vp on vp.id = vcp.volunteer_profile_id
    where vp.auth_user_id = auth.uid()
      and vp.account_status = 'approved'
      and vp.onboarding_status = 'approved'
      and vp.archived_at is null
      and cp.slug = position_slug
      and cp.status = 'active'
      and vcp.status = 'active'
  )
$$;

create or replace function public.is_current_operational_president()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_active_position('president') and public.has_active_platform_role('club_admin')
$$;

create or replace function public.has_effective_permission(
  permission_key text,
  scope_type text default 'global',
  scope_id uuid default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_profile_id uuid := public.current_volunteer_profile_id();
  v_permission_id uuid;
begin
  if v_profile_id is null then
    return false;
  end if;

  select id into v_permission_id
  from public.system_permissions
  where system_permissions.permission_key = has_effective_permission.permission_key
    and is_active = true;

  if v_permission_id is null then
    return false;
  end if;

  if public.has_active_platform_role('super_admin') then
    return true;
  end if;

  if exists (
    select 1
    from public.user_permission_overrides upo
    where upo.volunteer_profile_id = v_profile_id
      and upo.permission_id = v_permission_id
      and upo.effect = 'deny'
      and upo.status = 'active'
      and upo.starts_at <= now()
      and (upo.expires_at is null or upo.expires_at > now())
      and (
        upo.scope_type = 'global'
        or (upo.scope_type = has_effective_permission.scope_type and coalesce(upo.department_id, upo.event_id, upo.target_record_id) = scope_id)
      )
  ) then
    return false;
  end if;

  if exists (
    select 1
    from public.user_permission_overrides upo
    where upo.volunteer_profile_id = v_profile_id
      and upo.permission_id = v_permission_id
      and upo.effect = 'allow'
      and upo.status = 'active'
      and upo.starts_at <= now()
      and (upo.expires_at is null or upo.expires_at > now())
      and (
        upo.scope_type = 'global'
        or (upo.scope_type = has_effective_permission.scope_type and coalesce(upo.department_id, upo.event_id, upo.target_record_id) = scope_id)
      )
  ) then
    return true;
  end if;

  if exists (
    select 1
    from public.volunteer_platform_roles vpr
    join public.platform_role_permission_policies prpp on prpp.platform_role = vpr.role
    where vpr.volunteer_profile_id = v_profile_id
      and vpr.status = 'active'
      and prpp.permission_id = v_permission_id
      and prpp.effect = 'allow'
      and prpp.is_active = true
  ) then
    return true;
  end if;

  if exists (
    select 1
    from public.volunteer_club_positions vcp
    join public.club_positions cp on cp.id = vcp.club_position_id
    join public.club_position_permission_policies cppp on cppp.club_position_slug = cp.slug
    where vcp.volunteer_profile_id = v_profile_id
      and vcp.status = 'active'
      and cp.status = 'active'
      and cppp.permission_id = v_permission_id
      and cppp.effect = 'allow'
      and cppp.is_active = true
  ) then
    return true;
  end if;

  if scope_type = 'department' and scope_id is not null and exists (
    select 1
    from public.volunteer_department_memberships vdm
    join public.department_role_permission_policies drpp on drpp.department_role = vdm.department_role
    where vdm.volunteer_profile_id = v_profile_id
      and vdm.department_id = scope_id
      and vdm.membership_status = 'approved'
      and drpp.permission_id = v_permission_id
      and drpp.effect = 'allow'
      and drpp.is_active = true
  ) then
    return true;
  end if;

  return false;
end;
$$;

create or replace function public.get_action_authorization(
  permission_key text,
  scope_type text default 'global',
  scope_id uuid default null
)
returns text
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_profile_id uuid := public.current_volunteer_profile_id();
  v_requires_approval boolean := false;
begin
  if v_profile_id is null then
    return 'deny';
  end if;

  if public.has_active_platform_role('super_admin') then
    return 'direct';
  end if;

  if not public.has_effective_permission(permission_key, scope_type, scope_id) then
    return 'deny';
  end if;

  select coalesce(bool_or(policy_requires), false) into v_requires_approval
  from (
    select prpp.requires_approval as policy_requires
    from public.volunteer_platform_roles vpr
    join public.system_permissions sp on sp.permission_key = get_action_authorization.permission_key
    join public.platform_role_permission_policies prpp on prpp.platform_role = vpr.role and prpp.permission_id = sp.id
    where vpr.volunteer_profile_id = v_profile_id and vpr.status = 'active' and prpp.is_active = true
    union all
    select cppp.requires_approval
    from public.volunteer_club_positions vcp
    join public.club_positions cp on cp.id = vcp.club_position_id
    join public.system_permissions sp on sp.permission_key = get_action_authorization.permission_key
    join public.club_position_permission_policies cppp on cppp.club_position_slug = cp.slug and cppp.permission_id = sp.id
    where vcp.volunteer_profile_id = v_profile_id and vcp.status = 'active' and cp.status = 'active' and cppp.is_active = true
  ) policies;

  if v_requires_approval then
    return 'request_approval';
  end if;

  return 'direct';
end;
$$;

create or replace function public.can_manage_temporary_access()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_effective_permission('access_grants.manage', 'global', null)
$$;

-- Refresh Blood helpers for new department role names.
create or replace function public.is_blood_department_member()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_active_department_role(public.blood_department_id(), array['executive', 'deputy_head', 'department_head'])
$$;

create or replace function public.can_view_blood_operations()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_any_active_platform_role(array['super_admin', 'club_admin'])
    or public.has_blood_department_role(array['deputy_head', 'department_head'])
$$;

create or replace function public.can_manage_blood_donors()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_any_active_platform_role(array['super_admin', 'club_admin'])
    or public.has_blood_department_role(array['deputy_head', 'department_head'])
$$;

create or replace function public.can_manage_blood_requests()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_any_active_platform_role(array['super_admin', 'club_admin'])
    or public.has_blood_department_role(array['deputy_head', 'department_head'])
$$;

create or replace function public.can_manage_blood_matches()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_any_active_platform_role(array['super_admin', 'club_admin'])
    or public.has_blood_department_role(array['deputy_head', 'department_head'])
$$;

create or replace function public.can_verify_blood_donations()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_any_active_platform_role(array['super_admin'])
    or public.has_blood_department_role(array['department_head'])
$$;

create or replace function public.can_manage_blood_settings()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_any_active_platform_role(array['super_admin'])
    or public.has_blood_department_role(array['department_head'])
$$;

-- ==================================================
-- 4. RLS and grants
-- ==================================================

alter table public.system_permissions enable row level security;
alter table public.platform_role_permission_policies enable row level security;
alter table public.club_position_permission_policies enable row level security;
alter table public.department_role_permission_policies enable row level security;

revoke all on table public.system_permissions from anon, authenticated;
revoke all on table public.platform_role_permission_policies from anon, authenticated;
revoke all on table public.club_position_permission_policies from anon, authenticated;
revoke all on table public.department_role_permission_policies from anon, authenticated;

grant select on table public.system_permissions to authenticated;
grant select on table public.platform_role_permission_policies to authenticated;
grant select on table public.club_position_permission_policies to authenticated;
grant select on table public.department_role_permission_policies to authenticated;

drop policy if exists "Governance admins can read permissions" on public.system_permissions;
create policy "Governance admins can read permissions" on public.system_permissions
for select to authenticated
using (public.has_effective_permission('access_grants.view', 'global', null) or public.has_effective_permission('approval_requests.create', 'global', null));

drop policy if exists "Governance admins can read platform policies" on public.platform_role_permission_policies;
create policy "Governance admins can read platform policies" on public.platform_role_permission_policies
for select to authenticated
using (public.has_effective_permission('access_grants.view', 'global', null));

drop policy if exists "Governance admins can read position policies" on public.club_position_permission_policies;
create policy "Governance admins can read position policies" on public.club_position_permission_policies
for select to authenticated
using (public.has_effective_permission('access_grants.view', 'global', null));

drop policy if exists "Governance admins can read department policies" on public.department_role_permission_policies;
create policy "Governance admins can read department policies" on public.department_role_permission_policies
for select to authenticated
using (public.has_effective_permission('access_grants.view', 'global', null));

revoke all on function public.has_active_position(text) from public;
revoke all on function public.is_current_operational_president() from public;
revoke all on function public.has_effective_permission(text, text, uuid) from public;
revoke all on function public.get_action_authorization(text, text, uuid) from public;
revoke all on function public.can_manage_temporary_access() from public;

grant execute on function public.has_active_position(text) to authenticated;
grant execute on function public.is_current_operational_president() to authenticated;
grant execute on function public.has_effective_permission(text, text, uuid) to authenticated;
grant execute on function public.get_action_authorization(text, text, uuid) to authenticated;
grant execute on function public.can_manage_temporary_access() to authenticated;

select public.write_club_audit_log('access_governance.permission_catalogue_seeded', 'permission_policy', null, null, jsonb_build_object('phase', 'CM-4'));
