-- Official UIUSSC role permission matrix and access boundaries.
-- Extends CM-4 governance without replacing the existing architecture.

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
  ('event.view', 'event', 'View events', 'View event information according to scope.', 'normal', true, true, true, false),
  ('event.create', 'event', 'Create events', 'Create event operations.', 'elevated', true, false, false, false),
  ('event.update', 'event', 'Update events', 'Update event operations according to scope.', 'elevated', true, true, true, true),
  ('event.assign_lead', 'event', 'Assign Event Lead', 'Assign an official event lead.', 'sensitive', true, false, true, true),
  ('event.assign_department', 'event', 'Assign event departments', 'Assign supporting departments to event work.', 'elevated', true, true, true, true),
  ('event.delete', 'event', 'Delete events', 'Delete or destructively remove event records.', 'critical', true, false, true, true),
  ('task.view', 'task', 'View tasks', 'View tasks according to assignment and scope.', 'normal', true, true, true, true),
  ('task.create', 'task', 'Create tasks', 'Create tasks according to scope.', 'elevated', true, true, true, false),
  ('task.assign', 'task', 'Assign tasks', 'Assign tasks according to scope.', 'elevated', true, true, true, true),
  ('task.update', 'task', 'Update tasks', 'Update task details or progress according to scope.', 'normal', true, true, true, true),
  ('task.review', 'task', 'Review task submissions', 'Review submitted task work.', 'elevated', true, true, true, true),
  ('task.complete', 'task', 'Complete tasks', 'Close or complete tasks.', 'elevated', true, true, true, true),
  ('user.view', 'user', 'View users', 'View volunteer and staff records according to scope.', 'normal', true, true, false, true),
  ('user.approve', 'user', 'Approve users', 'Approve volunteer onboarding and staff setup.', 'elevated', true, true, false, true),
  ('user.suspend', 'user', 'Suspend users', 'Suspend user access through controlled workflow.', 'sensitive', true, false, false, true),
  ('user.manage_roles', 'user', 'Manage user roles', 'Manage positions, department roles, and platform access.', 'critical', true, true, false, true),
  ('department.view', 'department', 'View departments', 'View department records and members according to scope.', 'normal', true, true, false, false),
  ('department.manage_members', 'department', 'Manage department members', 'Manage department membership according to scope.', 'elevated', true, true, false, true),
  ('department.manage_tasks', 'department', 'Manage department tasks', 'Manage department task work according to scope.', 'elevated', true, true, true, true),
  ('content.create', 'content', 'Create content', 'Create website content drafts.', 'normal', true, false, false, false),
  ('content.update', 'content', 'Update content', 'Update website content.', 'elevated', true, false, false, true),
  ('content.publish', 'content', 'Publish content', 'Publish website content.', 'sensitive', true, false, false, true),
  ('committee.view', 'committee', 'View committees', 'View committee and position history.', 'normal', true, false, false, false),
  ('committee.create', 'committee', 'Create committees', 'Create a committee cycle.', 'sensitive', true, false, false, true),
  ('committee.manage_positions', 'committee', 'Manage committee positions', 'Assign, transfer, end, or revoke committee positions.', 'critical', true, false, false, true),
  ('blood.view', 'blood', 'View Blood Support', 'View Blood Department and blood support records according to scope.', 'sensitive', true, true, false, true),
  ('blood.manage_requests', 'blood', 'Manage blood requests', 'Manage blood support requests according to scope.', 'sensitive', true, true, false, true),
  ('blood.manage_donors', 'blood', 'Manage blood donors', 'Manage blood donor records according to scope.', 'sensitive', true, true, false, true),
  ('blood.verify_donation', 'blood', 'Verify blood donation', 'Verify fulfilled blood donation records.', 'sensitive', true, true, false, true),
  ('finance.budget_manage', 'finance', 'Manage budgets', 'Future finance permission for budget management.', 'sensitive', true, false, false, true),
  ('finance.expense_view', 'finance', 'View expenses', 'Future finance permission for expense visibility.', 'sensitive', true, false, false, true),
  ('finance.request_approve', 'finance', 'Approve financial requests', 'Future finance permission for financial approvals.', 'critical', true, false, false, true)
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

create temp table uiussc_permission_aliases(old_key text, new_key text) on commit drop;
insert into uiussc_permission_aliases(old_key, new_key)
values
  ('events.view_internal', 'event.view'),
  ('events.create', 'event.create'),
  ('events.update', 'event.update'),
  ('events.assign_departments', 'event.assign_department'),
  ('events.publish', 'content.publish'),
  ('events.cancel', 'event.delete'),
  ('tasks.view', 'task.view'),
  ('tasks.create', 'task.create'),
  ('tasks.assign', 'task.assign'),
  ('tasks.update_own', 'task.update'),
  ('tasks.review', 'task.review'),
  ('tasks.close', 'task.complete'),
  ('members.view', 'user.view'),
  ('members.review', 'user.approve'),
  ('members.update', 'user.approve'),
  ('members.suspend', 'user.suspend'),
  ('members.manage_department_membership', 'department.manage_members'),
  ('positions.view', 'committee.view'),
  ('positions.assign', 'committee.manage_positions'),
  ('positions.complete', 'committee.manage_positions'),
  ('positions.revoke', 'committee.manage_positions'),
  ('departments.view', 'department.view'),
  ('departments.manage_own', 'department.manage_tasks'),
  ('departments.manage', 'department.manage_members'),
  ('departments.manage_executives', 'department.manage_members'),
  ('departments.assign_head', 'user.manage_roles'),
  ('departments.assign_deputy', 'user.manage_roles'),
  ('content.manage', 'content.update'),
  ('blood.operations.view', 'blood.view'),
  ('blood.operations.manage', 'blood.manage_requests');

insert into public.platform_role_permission_policies (platform_role, permission_id, effect, scope_rule, requires_approval, approval_policy_key)
select distinct prpp.platform_role, new_perm.id, prpp.effect, prpp.scope_rule, prpp.requires_approval, prpp.approval_policy_key
from public.platform_role_permission_policies prpp
join public.system_permissions old_perm on old_perm.id = prpp.permission_id
join uiussc_permission_aliases aliases on aliases.old_key = old_perm.permission_key
join public.system_permissions new_perm on new_perm.permission_key = aliases.new_key
where prpp.is_active = true
on conflict do nothing;

insert into public.club_position_permission_policies (club_position_slug, permission_id, effect, scope_rule, requires_approval, approval_policy_key)
select distinct cppp.club_position_slug, new_perm.id, cppp.effect, cppp.scope_rule, cppp.requires_approval, cppp.approval_policy_key
from public.club_position_permission_policies cppp
join public.system_permissions old_perm on old_perm.id = cppp.permission_id
join uiussc_permission_aliases aliases on aliases.old_key = old_perm.permission_key
join public.system_permissions new_perm on new_perm.permission_key = aliases.new_key
where cppp.is_active = true
on conflict do nothing;

insert into public.department_role_permission_policies (department_role, permission_id, effect, scope_rule, requires_approval, approval_policy_key)
select distinct drpp.department_role, new_perm.id, drpp.effect, drpp.scope_rule, drpp.requires_approval, drpp.approval_policy_key
from public.department_role_permission_policies drpp
join public.system_permissions old_perm on old_perm.id = drpp.permission_id
join uiussc_permission_aliases aliases on aliases.old_key = old_perm.permission_key
join public.system_permissions new_perm on new_perm.permission_key = aliases.new_key
where drpp.is_active = true
on conflict do nothing;

create temp table uiussc_position_matrix(
  position_slug text,
  permission_key text,
  scope_rule text,
  requires_approval boolean,
  approval_policy_key text
) on commit drop;

insert into uiussc_position_matrix(position_slug, permission_key, scope_rule, requires_approval, approval_policy_key)
values
  ('president', 'event.view', 'global', false, null),
  ('president', 'event.create', 'global', false, null),
  ('president', 'event.update', 'global', false, null),
  ('president', 'event.assign_lead', 'global', false, null),
  ('president', 'event.assign_department', 'global', false, null),
  ('president', 'task.view', 'global', false, null),
  ('president', 'task.create', 'global', false, null),
  ('president', 'task.assign', 'global', false, null),
  ('president', 'task.update', 'global', false, null),
  ('president', 'task.review', 'global', false, null),
  ('president', 'task.complete', 'global', false, null),
  ('president', 'user.view', 'global', false, null),
  ('president', 'user.approve', 'global', false, null),
  ('president', 'department.view', 'global', false, null),
  ('president', 'department.manage_members', 'global', false, null),
  ('president', 'department.manage_tasks', 'global', false, null),
  ('president', 'content.create', 'global', false, null),
  ('president', 'content.update', 'global', false, null),
  ('president', 'content.publish', 'global', false, null),
  ('president', 'committee.view', 'global', false, null),
  ('president', 'committee.manage_positions', 'global', false, null),
  ('president', 'approval_requests.review', 'global', false, null),
  ('president', 'access_grants.view', 'global', false, null),
  ('vice-president', 'event.view', 'global', false, null),
  ('vice-president', 'event.create', 'global', false, null),
  ('vice-president', 'event.update', 'global', false, null),
  ('vice-president', 'event.assign_department', 'global', false, null),
  ('vice-president', 'task.view', 'global', false, null),
  ('vice-president', 'task.create', 'global', false, null),
  ('vice-president', 'task.assign', 'global', false, null),
  ('vice-president', 'task.update', 'global', false, null),
  ('vice-president', 'task.review', 'global', false, null),
  ('vice-president', 'department.view', 'global', false, null),
  ('vice-president', 'department.manage_tasks', 'global', true, 'president_review'),
  ('vice-president', 'user.view', 'global', false, null),
  ('vice-president', 'content.create', 'global', false, null),
  ('vice-president', 'content.update', 'global', true, 'president_review'),
  ('vice-president', 'committee.view', 'global', false, null),
  ('assistant-vice-president', 'event.view', 'global', false, null),
  ('assistant-vice-president', 'event.update', 'global', false, null),
  ('assistant-vice-president', 'task.view', 'global', false, null),
  ('assistant-vice-president', 'task.update', 'assigned_event', false, null),
  ('assistant-vice-president', 'department.view', 'global', false, null),
  ('assistant-vice-president', 'committee.view', 'global', false, null),
  ('general-secretary', 'event.view', 'global', false, null),
  ('general-secretary', 'event.create', 'global', false, null),
  ('general-secretary', 'event.update', 'global', false, null),
  ('general-secretary', 'event.assign_lead', 'global', true, 'president_review'),
  ('general-secretary', 'event.assign_department', 'global', false, null),
  ('general-secretary', 'task.view', 'global', false, null),
  ('general-secretary', 'task.create', 'global', false, null),
  ('general-secretary', 'task.assign', 'global', false, null),
  ('general-secretary', 'task.update', 'global', false, null),
  ('general-secretary', 'task.review', 'global', false, null),
  ('general-secretary', 'task.complete', 'global', false, null),
  ('general-secretary', 'department.view', 'global', false, null),
  ('general-secretary', 'department.manage_tasks', 'global', false, null),
  ('general-secretary', 'user.view', 'global', false, null),
  ('general-secretary', 'committee.view', 'global', false, null),
  ('treasurer', 'finance.budget_manage', 'global', false, null),
  ('treasurer', 'finance.expense_view', 'global', false, null),
  ('treasurer', 'finance.request_approve', 'global', true, 'president_review'),
  ('treasurer', 'committee.view', 'global', false, null),
  ('treasurer', 'event.view', 'global', false, null),
  ('treasurer', 'user.view', 'global', false, null);

insert into public.club_position_permission_policies (club_position_slug, permission_id, effect, scope_rule, requires_approval, approval_policy_key)
select matrix.position_slug, permissions.id, 'allow', matrix.scope_rule, matrix.requires_approval, matrix.approval_policy_key
from uiussc_position_matrix matrix
join public.system_permissions permissions on permissions.permission_key = matrix.permission_key
on conflict do nothing;

create temp table uiussc_department_role_matrix(
  department_role text,
  permission_key text,
  scope_rule text
) on commit drop;

insert into uiussc_department_role_matrix(department_role, permission_key, scope_rule)
values
  ('department_head', 'department.view', 'own_department'),
  ('department_head', 'department.manage_members', 'own_department'),
  ('department_head', 'department.manage_tasks', 'own_department'),
  ('department_head', 'event.view', 'own_department'),
  ('department_head', 'event.update', 'own_department'),
  ('department_head', 'task.view', 'own_department'),
  ('department_head', 'task.create', 'own_department'),
  ('department_head', 'task.assign', 'own_department'),
  ('department_head', 'task.update', 'own_department'),
  ('department_head', 'task.review', 'own_department'),
  ('department_head', 'task.complete', 'own_department'),
  ('deputy_head', 'department.view', 'own_department'),
  ('deputy_head', 'department.manage_tasks', 'own_department'),
  ('deputy_head', 'event.view', 'own_department'),
  ('deputy_head', 'task.view', 'own_department'),
  ('deputy_head', 'task.assign', 'own_department'),
  ('deputy_head', 'task.update', 'own_department'),
  ('deputy_head', 'task.review', 'own_department'),
  ('executive', 'department.view', 'own_department'),
  ('executive', 'event.view', 'assigned_event'),
  ('executive', 'task.view', 'assigned_event'),
  ('executive', 'task.update', 'own_record');

insert into public.department_role_permission_policies (department_role, permission_id, effect, scope_rule)
select matrix.department_role, permissions.id, 'allow', matrix.scope_rule
from uiussc_department_role_matrix matrix
join public.system_permissions permissions on permissions.permission_key = matrix.permission_key
on conflict do nothing;

create or replace function public.permission_scope_matches(
  p_policy_scope text,
  p_requested_scope text,
  p_requested_id uuid,
  p_profile_id uuid,
  p_department_id uuid default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if p_policy_scope = 'global' then
    return p_requested_scope = 'global' or p_requested_id is null;
  end if;

  if p_policy_scope = 'own_department' then
    return p_requested_scope = 'department'
      and p_requested_id is not null
      and p_department_id = p_requested_id;
  end if;

  if p_policy_scope = 'assigned_event' then
    return p_requested_scope = 'event'
      and p_requested_id is not null
      and (
        exists (
          select 1
          from public.club_event_operations ceo
          where ceo.event_id = p_requested_id
            and ceo.owner_profile_id = p_profile_id
        )
        or exists (
          select 1
          from public.event_department_assignments eda
          where eda.event_id = p_requested_id
            and eda.assignment_status <> 'cancelled'
            and (
              eda.lead_profile_id = p_profile_id
              or (p_department_id is not null and eda.department_id = p_department_id)
            )
        )
        or exists (
          select 1
          from public.event_task_assignees eta
          join public.event_department_tasks edt on edt.id = eta.task_id
          where edt.event_id = p_requested_id
            and eta.volunteer_profile_id = p_profile_id
            and eta.assignment_status = 'active'
        )
      );
  end if;

  if p_policy_scope = 'own_record' then
    return p_requested_scope = 'record'
      and p_requested_id is not null
      and exists (
        select 1
        from public.event_task_assignees eta
        where eta.task_id = p_requested_id
          and eta.volunteer_profile_id = p_profile_id
          and eta.assignment_status = 'active'
      );
  end if;

  return false;
end;
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
      and upo.status in ('active', 'scheduled')
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
      and upo.status in ('active', 'scheduled')
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
      and public.permission_scope_matches(prpp.scope_rule, has_effective_permission.scope_type, scope_id, v_profile_id, null)
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
      and public.permission_scope_matches(cppp.scope_rule, has_effective_permission.scope_type, scope_id, v_profile_id, null)
  ) then
    return true;
  end if;

  if exists (
    select 1
    from public.volunteer_department_memberships vdm
    join public.department_role_permission_policies drpp on drpp.department_role = vdm.department_role
    where vdm.volunteer_profile_id = v_profile_id
      and vdm.membership_status = 'approved'
      and vdm.removed_at is null
      and drpp.permission_id = v_permission_id
      and drpp.effect = 'allow'
      and drpp.is_active = true
      and public.permission_scope_matches(drpp.scope_rule, has_effective_permission.scope_type, scope_id, v_profile_id, vdm.department_id)
  ) then
    return true;
  end if;

  return false;
end;
$$;

create or replace function public.can_manage_volunteers()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_active_platform_role('super_admin')
    or public.has_effective_permission('user.approve', 'global', null)
    or public.has_effective_permission('members.review', 'global', null)
$$;

create or replace function public.can_manage_departments()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_active_platform_role('super_admin')
    or public.has_effective_permission('department.manage_members', 'global', null)
    or public.has_effective_permission('departments.manage', 'global', null)
$$;

create or replace function public.can_manage_platform_roles()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_active_platform_role('super_admin')
    or public.has_effective_permission('user.manage_roles', 'global', null)
    or public.has_effective_permission('platform_roles.assign', 'global', null)
$$;

create or replace function public.can_view_blood_operations()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_active_platform_role('super_admin')
    or public.has_effective_permission('blood.view', 'global', null)
    or public.has_effective_permission('blood.view', 'department', public.blood_department_id())
    or public.has_effective_permission('blood.operations.view', 'global', null)
    or public.has_effective_permission('blood.operations.view', 'department', public.blood_department_id())
$$;

create or replace function public.can_manage_blood_donors()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_active_platform_role('super_admin')
    or public.has_effective_permission('blood.manage_donors', 'global', null)
    or public.has_effective_permission('blood.manage_donors', 'department', public.blood_department_id())
    or public.has_effective_permission('blood.operations.manage', 'global', null)
    or public.has_effective_permission('blood.operations.manage', 'department', public.blood_department_id())
$$;

create or replace function public.can_manage_blood_requests()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_active_platform_role('super_admin')
    or public.has_effective_permission('blood.manage_requests', 'global', null)
    or public.has_effective_permission('blood.manage_requests', 'department', public.blood_department_id())
    or public.has_effective_permission('blood.operations.manage', 'global', null)
    or public.has_effective_permission('blood.operations.manage', 'department', public.blood_department_id())
$$;

create or replace function public.can_verify_blood_donations()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_active_platform_role('super_admin')
    or public.has_effective_permission('blood.verify_donation', 'global', null)
    or public.has_effective_permission('blood.verify_donation', 'department', public.blood_department_id())
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
      and public.permission_scope_matches(prpp.scope_rule, get_action_authorization.scope_type, scope_id, v_profile_id, null)
    union all
    select cppp.requires_approval
    from public.volunteer_club_positions vcp
    join public.club_positions cp on cp.id = vcp.club_position_id
    join public.system_permissions sp on sp.permission_key = get_action_authorization.permission_key
    join public.club_position_permission_policies cppp on cppp.club_position_slug = cp.slug and cppp.permission_id = sp.id
    where vcp.volunteer_profile_id = v_profile_id and vcp.status = 'active' and cp.status = 'active' and cppp.is_active = true
      and public.permission_scope_matches(cppp.scope_rule, get_action_authorization.scope_type, scope_id, v_profile_id, null)
    union all
    select drpp.requires_approval
    from public.volunteer_department_memberships vdm
    join public.system_permissions sp on sp.permission_key = get_action_authorization.permission_key
    join public.department_role_permission_policies drpp on drpp.department_role = vdm.department_role and drpp.permission_id = sp.id
    where vdm.volunteer_profile_id = v_profile_id and vdm.membership_status = 'approved' and drpp.is_active = true
      and public.permission_scope_matches(drpp.scope_rule, get_action_authorization.scope_type, scope_id, v_profile_id, vdm.department_id)
  ) policies;

  if v_requires_approval then
    return 'request_approval';
  end if;

  return 'direct';
end;
$$;

revoke all on function public.permission_scope_matches(text, text, uuid, uuid, uuid) from public;
grant execute on function public.permission_scope_matches(text, text, uuid, uuid, uuid) to authenticated;

select public.write_club_audit_log(
  'access_governance.official_role_matrix_seeded',
  'permission_policy',
  null,
  null,
  jsonb_build_object('phase', 'official-uiussc-role-matrix', 'scope_boundary_enforced', true)
);
