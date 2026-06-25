-- CM-4: Temporary access and approval workflow foundation.

-- ==================================================
-- 1. Temporary grants/restrictions
-- ==================================================

create table if not exists public.user_permission_overrides (
  id uuid primary key default extensions.gen_random_uuid(),
  volunteer_profile_id uuid not null references public.volunteer_profiles(id) on delete restrict,
  permission_id uuid not null references public.system_permissions(id) on delete restrict,
  effect text not null,
  scope_type text not null,
  department_id uuid references public.club_departments(id) on delete restrict,
  event_id uuid references public.events(id) on delete restrict,
  target_record_type text,
  target_record_id uuid,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'active',
  reason text not null,
  granted_by uuid not null references public.volunteer_profiles(id) on delete restrict,
  granted_at timestamptz not null default now(),
  revoked_by uuid references public.volunteer_profiles(id) on delete set null,
  revoked_at timestamptz,
  revocation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_permission_overrides_effect_check check (effect in ('allow', 'deny')),
  constraint user_permission_overrides_scope_check check (scope_type in ('global', 'department', 'event', 'record')),
  constraint user_permission_overrides_status_check check (status in ('scheduled', 'active', 'expired', 'revoked', 'cancelled')),
  constraint user_permission_overrides_reason_check check (btrim(reason) <> ''),
  constraint user_permission_overrides_time_check check (expires_at is null or expires_at > starts_at),
  constraint user_permission_overrides_scope_target_check check (
    (scope_type = 'global' and department_id is null and event_id is null and target_record_id is null)
    or (scope_type = 'department' and department_id is not null and event_id is null and target_record_id is null)
    or (scope_type = 'event' and event_id is not null and department_id is null and target_record_id is null)
    or (scope_type = 'record' and target_record_type is not null and target_record_id is not null)
  )
);

create table if not exists public.user_permission_override_history (
  id uuid primary key default extensions.gen_random_uuid(),
  override_id uuid not null references public.user_permission_overrides(id) on delete restrict,
  previous_status text,
  new_status text not null,
  changed_by uuid references public.volunteer_profiles(id) on delete set null,
  reason text,
  changed_at timestamptz not null default now(),
  constraint user_permission_override_history_status_check check (
    (previous_status is null or previous_status in ('scheduled', 'active', 'expired', 'revoked', 'cancelled'))
    and new_status in ('scheduled', 'active', 'expired', 'revoked', 'cancelled')
  )
);

create index if not exists user_permission_overrides_profile_idx on public.user_permission_overrides (volunteer_profile_id);
create index if not exists user_permission_overrides_permission_idx on public.user_permission_overrides (permission_id);
create index if not exists user_permission_overrides_status_time_idx on public.user_permission_overrides (status, starts_at, expires_at);
create index if not exists user_permission_overrides_department_idx on public.user_permission_overrides (department_id) where department_id is not null;
create index if not exists user_permission_overrides_event_idx on public.user_permission_overrides (event_id) where event_id is not null;
create index if not exists user_permission_override_history_override_idx on public.user_permission_override_history (override_id, changed_at desc);

drop trigger if exists set_user_permission_overrides_updated_at on public.user_permission_overrides;
create trigger set_user_permission_overrides_updated_at
before update on public.user_permission_overrides
for each row execute function public.set_updated_at();

-- Recreate resolver now that override tables exist. Scheduled grants work after starts_at without a status job.
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

-- ==================================================
-- 2. Approval requests
-- ==================================================

create table if not exists public.approval_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  action_key text not null,
  requester_profile_id uuid not null references public.volunteer_profiles(id) on delete restrict,
  target_type text not null,
  target_id uuid,
  scope_type text not null default 'global',
  department_id uuid references public.club_departments(id) on delete restrict,
  event_id uuid references public.events(id) on delete restrict,
  request_payload jsonb not null default '{}'::jsonb,
  reason text not null,
  request_status text not null default 'pending',
  required_approver_policy text not null default 'president_or_super_admin',
  expires_at timestamptz,
  reviewed_by uuid references public.volunteer_profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_reason text,
  executed_by uuid references public.volunteer_profiles(id) on delete set null,
  executed_at timestamptz,
  execution_status text,
  execution_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint approval_requests_status_check check (request_status in ('pending', 'approved', 'rejected', 'expired', 'cancelled', 'executed', 'execution_failed')),
  constraint approval_requests_execution_status_check check (execution_status is null or execution_status in ('succeeded', 'failed')),
  constraint approval_requests_scope_check check (scope_type in ('global', 'department', 'event', 'record')),
  constraint approval_requests_reason_check check (btrim(reason) <> ''),
  constraint approval_requests_payload_no_secret_check check (
    not (request_payload ? 'password')
    and not (request_payload ? 'token')
    and not (request_payload ? 'access_token')
    and not (request_payload ? 'refresh_token')
    and not (request_payload ? 'invite_token')
    and not (request_payload ? 'secret')
  )
);

create table if not exists public.approval_request_actions (
  id uuid primary key default extensions.gen_random_uuid(),
  approval_request_id uuid not null references public.approval_requests(id) on delete restrict,
  action_type text not null,
  actor_profile_id uuid references public.volunteer_profiles(id) on delete set null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint approval_request_actions_metadata_no_secret_check check (
    not (metadata ? 'password')
    and not (metadata ? 'token')
    and not (metadata ? 'access_token')
    and not (metadata ? 'refresh_token')
    and not (metadata ? 'invite_token')
    and not (metadata ? 'secret')
  )
);

create unique index if not exists approval_requests_one_pending_action_idx
on public.approval_requests (action_key, target_type, target_id, requester_profile_id)
where request_status = 'pending' and target_id is not null;

create index if not exists approval_requests_requester_idx on public.approval_requests (requester_profile_id, created_at desc);
create index if not exists approval_requests_status_idx on public.approval_requests (request_status, created_at desc);
create index if not exists approval_requests_department_idx on public.approval_requests (department_id) where department_id is not null;
create index if not exists approval_request_actions_request_idx on public.approval_request_actions (approval_request_id, created_at);

drop trigger if exists set_approval_requests_updated_at on public.approval_requests;
create trigger set_approval_requests_updated_at
before update on public.approval_requests
for each row execute function public.set_updated_at();

-- ==================================================
-- 3. Controlled RPCs
-- ==================================================

create or replace function public.cm4_is_supported_approval_action(p_action_key text)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select p_action_key in (
    'members.suspend',
    'members.archive',
    'members.remove_department_membership',
    'departments.assign_head',
    'departments.assign_deputy',
    'positions.complete',
    'positions.revoke',
    'departments.archive',
    'platform_roles.revoke_non_super_admin',
    'access_grants.grant_elevated',
    'access_grants.revoke_elevated'
  )
$$;

create or replace function public.can_review_approval_request(p_request_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_request public.approval_requests%rowtype;
begin
  if v_actor is null then
    return false;
  end if;

  select * into v_request from public.approval_requests where id = p_request_id;
  if not found or v_request.request_status <> 'pending' then
    return false;
  end if;

  if v_request.requester_profile_id = v_actor then
    return false;
  end if;

  return public.has_active_platform_role('super_admin') or public.is_current_operational_president();
end;
$$;

create or replace function public.grant_temporary_access(
  p_profile_id uuid,
  p_permission_key text,
  p_effect text,
  p_scope_type text,
  p_department_id uuid,
  p_event_id uuid,
  p_target_record_type text,
  p_target_record_id uuid,
  p_starts_at timestamptz,
  p_expires_at timestamptz,
  p_reason text
)
returns table(override_id uuid, status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_permission public.system_permissions%rowtype;
  v_override public.user_permission_overrides%rowtype;
begin
  if v_actor is null or not public.can_manage_temporary_access() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if v_actor = p_profile_id and not public.has_active_platform_role('super_admin') then
    raise exception 'Self-grant is not allowed' using errcode = '42501';
  end if;

  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  select * into v_permission
  from public.system_permissions
  where permission_key = p_permission_key and is_active = true;

  if not found then
    raise exception 'Invalid permission' using errcode = '22023';
  end if;

  if v_permission.risk_level = 'critical' and not public.has_active_platform_role('super_admin') then
    raise exception 'Critical permission requires Super Admin' using errcode = '42501';
  end if;

  insert into public.user_permission_overrides (
    volunteer_profile_id,
    permission_id,
    effect,
    scope_type,
    department_id,
    event_id,
    target_record_type,
    target_record_id,
    starts_at,
    expires_at,
    status,
    reason,
    granted_by
  )
  values (
    p_profile_id,
    v_permission.id,
    p_effect,
    p_scope_type,
    p_department_id,
    p_event_id,
    nullif(btrim(coalesce(p_target_record_type, '')), ''),
    p_target_record_id,
    coalesce(p_starts_at, now()),
    p_expires_at,
    case when coalesce(p_starts_at, now()) > now() then 'scheduled' else 'active' end,
    btrim(p_reason),
    v_actor
  )
  returning * into v_override;

  insert into public.user_permission_override_history (override_id, previous_status, new_status, changed_by, reason)
  values (v_override.id, null, v_override.status, v_actor, p_reason);

  perform public.write_club_audit_log('temporary_access.grant', 'temporary_access', v_override.id, p_department_id, jsonb_build_object('permission_key', p_permission_key, 'effect', p_effect, 'scope_type', p_scope_type));

  return query select v_override.id, v_override.status;
end;
$$;

create or replace function public.revoke_temporary_access(p_override_id uuid, p_reason text)
returns table(override_id uuid, status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_override public.user_permission_overrides%rowtype;
begin
  if v_actor is null or not public.can_manage_temporary_access() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  select * into v_override from public.user_permission_overrides where id = p_override_id for update;
  if not found then
    raise exception 'Temporary access record not found' using errcode = '02000';
  end if;

  if v_override.status in ('revoked', 'expired', 'cancelled') then
    return query select v_override.id, v_override.status;
    return;
  end if;

  update public.user_permission_overrides
  set status = 'revoked', revoked_by = v_actor, revoked_at = now(), revocation_reason = btrim(p_reason)
  where id = p_override_id
  returning * into v_override;

  insert into public.user_permission_override_history (override_id, previous_status, new_status, changed_by, reason)
  values (v_override.id, 'active', 'revoked', v_actor, p_reason);

  perform public.write_club_audit_log('temporary_access.revoke', 'temporary_access', v_override.id, v_override.department_id, jsonb_build_object('scope_type', v_override.scope_type));

  return query select v_override.id, v_override.status;
end;
$$;

create or replace function public.create_approval_request(
  p_action_key text,
  p_target_type text,
  p_target_id uuid,
  p_scope_type text,
  p_department_id uuid,
  p_event_id uuid,
  p_request_payload jsonb,
  p_reason text
)
returns table(approval_request_id uuid, request_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_request public.approval_requests%rowtype;
begin
  if v_actor is null or not public.has_effective_permission('approval_requests.create', coalesce(p_scope_type, 'global'), coalesce(p_department_id, p_event_id)) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if not public.cm4_is_supported_approval_action(p_action_key) then
    raise exception 'Unsupported approval action' using errcode = '22023';
  end if;

  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  insert into public.approval_requests (
    action_key,
    requester_profile_id,
    target_type,
    target_id,
    scope_type,
    department_id,
    event_id,
    request_payload,
    reason,
    expires_at
  )
  values (
    p_action_key,
    v_actor,
    btrim(p_target_type),
    p_target_id,
    coalesce(p_scope_type, 'global'),
    p_department_id,
    p_event_id,
    coalesce(p_request_payload, '{}'::jsonb),
    btrim(p_reason),
    now() + interval '14 days'
  )
  returning * into v_request;

  insert into public.approval_request_actions (approval_request_id, action_type, actor_profile_id, reason)
  values (v_request.id, 'created', v_actor, p_reason);

  perform public.write_club_audit_log('approval_request.create', 'approval_request', v_request.id, p_department_id, jsonb_build_object('action_key', p_action_key));

  return query select v_request.id, v_request.request_status;
end;
$$;

create or replace function public.cancel_approval_request(p_request_id uuid, p_reason text)
returns table(approval_request_id uuid, request_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_request public.approval_requests%rowtype;
begin
  select * into v_request from public.approval_requests where id = p_request_id for update;
  if v_actor is null or not found or v_request.requester_profile_id <> v_actor or v_request.request_status <> 'pending' then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  update public.approval_requests
  set request_status = 'cancelled', review_reason = nullif(btrim(coalesce(p_reason, '')), '')
  where id = p_request_id
  returning * into v_request;

  insert into public.approval_request_actions (approval_request_id, action_type, actor_profile_id, reason)
  values (v_request.id, 'cancelled', v_actor, p_reason);

  perform public.write_club_audit_log('approval_request.cancel', 'approval_request', v_request.id, v_request.department_id, jsonb_build_object('action_key', v_request.action_key));

  return query select v_request.id, v_request.request_status;
end;
$$;

create or replace function public.review_approval_request(p_request_id uuid, p_decision text, p_reason text)
returns table(approval_request_id uuid, request_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_request public.approval_requests%rowtype;
  v_status text;
begin
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid review decision' using errcode = '22023';
  end if;

  if not public.can_review_approval_request(p_request_id) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into v_request from public.approval_requests where id = p_request_id for update;
  if v_request.expires_at is not null and v_request.expires_at <= now() then
    update public.approval_requests set request_status = 'expired' where id = p_request_id returning * into v_request;
    raise exception 'Approval request expired' using errcode = '22023';
  end if;

  v_status := p_decision;
  update public.approval_requests
  set request_status = v_status, reviewed_by = v_actor, reviewed_at = now(), review_reason = nullif(btrim(coalesce(p_reason, '')), '')
  where id = p_request_id
  returning * into v_request;

  insert into public.approval_request_actions (approval_request_id, action_type, actor_profile_id, reason)
  values (v_request.id, v_status, v_actor, p_reason);

  perform public.write_club_audit_log('approval_request.review', 'approval_request', v_request.id, v_request.department_id, jsonb_build_object('action_key', v_request.action_key, 'decision', v_status));

  return query select v_request.id, v_request.request_status;
end;
$$;

create or replace function public.execute_approved_request(p_request_id uuid, p_reason text)
returns table(approval_request_id uuid, execution_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_request public.approval_requests%rowtype;
  v_payload jsonb;
  v_permission_key text;
  v_effect text;
  v_scope_type text;
begin
  if v_actor is null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into v_request from public.approval_requests where id = p_request_id for update;
  if not found then
    raise exception 'Approval request not found' using errcode = '02000';
  end if;

  if v_request.request_status <> 'approved' then
    raise exception 'Only approved requests can execute' using errcode = '22023';
  end if;

  if v_request.requester_profile_id = v_actor and not public.has_active_platform_role('super_admin') then
    raise exception 'Requester cannot execute own approved request' using errcode = '42501';
  end if;

  if not (public.has_active_platform_role('super_admin') or v_request.reviewed_by = v_actor or public.is_current_operational_president()) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  v_payload := v_request.request_payload;

  if v_request.action_key = 'members.suspend' then
    update public.volunteer_profiles
    set account_status = 'suspended', suspended_by = v_actor, suspended_at = now(), suspension_reason = coalesce(p_reason, v_request.reason)
    where id = v_request.target_id and account_status <> 'archived';
  elsif v_request.action_key = 'members.archive' then
    update public.volunteer_profiles
    set account_status = 'archived', archived_at = now()
    where id = v_request.target_id and account_status <> 'archived';
  elsif v_request.action_key = 'members.remove_department_membership' then
    update public.volunteer_department_memberships
    set membership_status = 'removed', removed_by = v_actor, removed_at = now(), removal_reason = coalesce(p_reason, v_request.reason)
    where id = v_request.target_id and membership_status <> 'removed';
  elsif v_request.action_key = 'departments.assign_head' then
    update public.volunteer_department_memberships
    set department_role = 'department_head', approved_by = coalesce(approved_by, v_actor), approved_at = coalesce(approved_at, now()), membership_status = 'approved'
    where id = v_request.target_id;
  elsif v_request.action_key = 'departments.assign_deputy' then
    update public.volunteer_department_memberships
    set department_role = 'deputy_head', approved_by = coalesce(approved_by, v_actor), approved_at = coalesce(approved_at, now()), membership_status = 'approved'
    where id = v_request.target_id;
  elsif v_request.action_key = 'positions.complete' then
    update public.volunteer_club_positions
    set status = 'completed', ended_by = v_actor, ended_at = now(), reason = coalesce(p_reason, v_request.reason)
    where id = v_request.target_id and status = 'active';
  elsif v_request.action_key = 'positions.revoke' then
    update public.volunteer_club_positions
    set status = 'revoked', revoked_by = v_actor, revoked_at = now(), reason = coalesce(p_reason, v_request.reason)
    where id = v_request.target_id and status = 'active';
  elsif v_request.action_key = 'departments.archive' then
    update public.club_departments
    set status = 'archived', archived_at = now()
    where id = v_request.target_id and archived_at is null;
  elsif v_request.action_key = 'platform_roles.revoke_non_super_admin' then
    update public.volunteer_platform_roles
    set status = 'revoked', revoked_by = v_actor, revoked_at = now(), revocation_reason = coalesce(p_reason, v_request.reason)
    where id = v_request.target_id and role <> 'super_admin' and status = 'active';
  elsif v_request.action_key = 'access_grants.grant_elevated' then
    v_permission_key := v_payload ->> 'permission_key';
    v_effect := coalesce(v_payload ->> 'effect', 'allow');
    v_scope_type := coalesce(v_payload ->> 'scope_type', 'global');
    perform public.grant_temporary_access(
      (v_payload ->> 'profile_id')::uuid,
      v_permission_key,
      v_effect,
      v_scope_type,
      nullif(v_payload ->> 'department_id', '')::uuid,
      nullif(v_payload ->> 'event_id', '')::uuid,
      nullif(v_payload ->> 'target_record_type', ''),
      nullif(v_payload ->> 'target_record_id', '')::uuid,
      coalesce(nullif(v_payload ->> 'starts_at', '')::timestamptz, now()),
      nullif(v_payload ->> 'expires_at', '')::timestamptz,
      coalesce(p_reason, v_request.reason)
    );
  elsif v_request.action_key = 'access_grants.revoke_elevated' then
    perform public.revoke_temporary_access((v_payload ->> 'override_id')::uuid, coalesce(p_reason, v_request.reason));
  else
    raise exception 'Unsupported approval action' using errcode = '22023';
  end if;

  update public.approval_requests
  set request_status = 'executed', executed_by = v_actor, executed_at = now(), execution_status = 'succeeded'
  where id = p_request_id
  returning * into v_request;

  insert into public.approval_request_actions (approval_request_id, action_type, actor_profile_id, reason)
  values (v_request.id, 'executed', v_actor, p_reason);

  perform public.write_club_audit_log('approval_request.execute', 'approval_request', v_request.id, v_request.department_id, jsonb_build_object('action_key', v_request.action_key));

  return query select v_request.id, v_request.execution_status;
exception
  when others then
    if v_request.id is not null then
      update public.approval_requests
      set request_status = 'execution_failed', executed_by = v_actor, executed_at = now(), execution_status = 'failed', execution_error_code = sqlstate
      where id = v_request.id;
    end if;
    raise;
end;
$$;

create or replace function public.expire_approval_requests()
returns integer
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_count integer;
begin
  if v_actor is null or not public.has_active_platform_role('super_admin') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  update public.approval_requests
  set request_status = 'expired'
  where request_status = 'pending'
    and expires_at is not null
    and expires_at <= now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ==================================================
-- 4. RLS and grants
-- ==================================================

alter table public.user_permission_overrides enable row level security;
alter table public.user_permission_override_history enable row level security;
alter table public.approval_requests enable row level security;
alter table public.approval_request_actions enable row level security;

revoke all on table public.user_permission_overrides from anon, authenticated;
revoke all on table public.user_permission_override_history from anon, authenticated;
revoke all on table public.approval_requests from anon, authenticated;
revoke all on table public.approval_request_actions from anon, authenticated;

grant select on table public.user_permission_overrides to authenticated;
grant select on table public.user_permission_override_history to authenticated;
grant select on table public.approval_requests to authenticated;
grant select on table public.approval_request_actions to authenticated;

drop policy if exists "Governance admins can read overrides" on public.user_permission_overrides;
create policy "Governance admins can read overrides" on public.user_permission_overrides
for select to authenticated
using (
  volunteer_profile_id = public.current_volunteer_profile_id()
  or public.has_effective_permission('access_grants.view', 'global', null)
);

drop policy if exists "Governance admins can read override history" on public.user_permission_override_history;
create policy "Governance admins can read override history" on public.user_permission_override_history
for select to authenticated
using (
  public.has_effective_permission('access_grants.view', 'global', null)
  or exists (
    select 1 from public.user_permission_overrides upo
    where upo.id = user_permission_override_history.override_id
      and upo.volunteer_profile_id = public.current_volunteer_profile_id()
  )
);

drop policy if exists "Authorized users can read approval requests" on public.approval_requests;
create policy "Authorized users can read approval requests" on public.approval_requests
for select to authenticated
using (
  requester_profile_id = public.current_volunteer_profile_id()
  or public.has_effective_permission('approval_requests.review', 'global', null)
  or public.has_active_platform_role('super_admin')
);

drop policy if exists "Authorized users can read approval actions" on public.approval_request_actions;
create policy "Authorized users can read approval actions" on public.approval_request_actions
for select to authenticated
using (
  public.has_effective_permission('approval_requests.review', 'global', null)
  or exists (
    select 1 from public.approval_requests ar
    where ar.id = approval_request_actions.approval_request_id
      and ar.requester_profile_id = public.current_volunteer_profile_id()
  )
);

revoke all on function public.cm4_is_supported_approval_action(text) from public;
revoke all on function public.can_review_approval_request(uuid) from public;
revoke all on function public.grant_temporary_access(uuid, text, text, text, uuid, uuid, text, uuid, timestamptz, timestamptz, text) from public;
revoke all on function public.revoke_temporary_access(uuid, text) from public;
revoke all on function public.create_approval_request(text, text, uuid, text, uuid, uuid, jsonb, text) from public;
revoke all on function public.cancel_approval_request(uuid, text) from public;
revoke all on function public.review_approval_request(uuid, text, text) from public;
revoke all on function public.execute_approved_request(uuid, text) from public;
revoke all on function public.expire_approval_requests() from public;

grant execute on function public.cm4_is_supported_approval_action(text) to authenticated;
grant execute on function public.can_review_approval_request(uuid) to authenticated;
grant execute on function public.grant_temporary_access(uuid, text, text, text, uuid, uuid, text, uuid, timestamptz, timestamptz, text) to authenticated;
grant execute on function public.revoke_temporary_access(uuid, text) to authenticated;
grant execute on function public.create_approval_request(text, text, uuid, text, uuid, uuid, jsonb, text) to authenticated;
grant execute on function public.cancel_approval_request(uuid, text) to authenticated;
grant execute on function public.review_approval_request(uuid, text, text) to authenticated;
grant execute on function public.execute_approved_request(uuid, text) to authenticated;
grant execute on function public.expire_approval_requests() to authenticated;

select public.write_club_audit_log('access_governance.approval_foundation_ready', 'approval_request', null, null, jsonb_build_object('phase', 'CM-4'));
