-- Committee Management and Leadership Lifecycle System.
-- Extends official positions and volunteer_club_positions without deleting history.

create table if not exists public.committees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  session_label text not null,
  start_date date not null,
  end_date date,
  status text not null default 'draft',
  created_by uuid references public.volunteer_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  activated_by uuid references public.volunteer_profiles(id) on delete set null,
  activated_at timestamptz,
  completed_by uuid references public.volunteer_profiles(id) on delete set null,
  completed_at timestamptz,
  archived_by uuid references public.volunteer_profiles(id) on delete set null,
  archived_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint committees_status_check check (status in ('draft', 'active', 'completed', 'archived')),
  constraint committees_dates_check check (end_date is null or end_date >= start_date),
  constraint committees_name_check check (length(btrim(name)) >= 3),
  constraint committees_session_check check (length(btrim(session_label)) >= 4)
);

create unique index if not exists committees_one_active_idx
on public.committees ((status))
where status = 'active';

create unique index if not exists committees_session_unique_idx
on public.committees (lower(session_label));

create table if not exists public.committee_memberships (
  id uuid primary key default gen_random_uuid(),
  committee_id uuid not null references public.committees(id) on delete restrict,
  volunteer_profile_id uuid not null references public.volunteer_profiles(id) on delete restrict,
  club_position_id uuid not null references public.club_positions(id) on delete restrict,
  volunteer_club_position_id uuid references public.volunteer_club_positions(id) on delete set null,
  is_primary_position boolean not null default true,
  assigned_date date not null default current_date,
  assigned_by uuid references public.volunteer_profiles(id) on delete set null,
  start_date date not null default current_date,
  end_date date,
  status text not null default 'active',
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_by uuid references public.volunteer_profiles(id) on delete set null,
  ended_at timestamptz,
  archived_at timestamptz,
  constraint committee_memberships_status_check check (status in ('active', 'ended', 'removed', 'archived')),
  constraint committee_memberships_dates_check check (end_date is null or end_date >= start_date)
);

create index if not exists committee_memberships_committee_idx on public.committee_memberships (committee_id);
create index if not exists committee_memberships_profile_idx on public.committee_memberships (volunteer_profile_id);
create index if not exists committee_memberships_position_idx on public.committee_memberships (club_position_id);

create unique index if not exists committee_memberships_one_active_primary_position_idx
on public.committee_memberships (committee_id, club_position_id)
where status = 'active' and is_primary_position = true;

create unique index if not exists committee_memberships_one_active_profile_position_idx
on public.committee_memberships (committee_id, volunteer_profile_id, club_position_id)
where status = 'active';

drop trigger if exists set_committees_updated_at on public.committees;
create trigger set_committees_updated_at
before update on public.committees
for each row execute function public.set_updated_at();

drop trigger if exists set_committee_memberships_updated_at on public.committee_memberships;
create trigger set_committee_memberships_updated_at
before update on public.committee_memberships
for each row execute function public.set_updated_at();

create or replace function public.can_view_committees()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_active_platform_role('super_admin')
    or public.has_effective_permission('committee.view', 'global', null)
    or public.has_effective_permission('committee.manage_positions', 'global', null)
$$;

create or replace function public.can_manage_committees()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_active_platform_role('super_admin')
    or public.has_effective_permission('committee.manage_positions', 'global', null)
    or public.has_effective_permission('committee.create', 'global', null)
$$;

create or replace function public.create_committee(
  p_name text,
  p_session_label text,
  p_start_date date,
  p_end_date date default null
)
returns table(committee_id uuid, status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_committee public.committees%rowtype;
begin
  if v_actor is null or not public.can_manage_committees() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  insert into public.committees (name, session_label, start_date, end_date, status, created_by)
  values (btrim(p_name), btrim(p_session_label), p_start_date, p_end_date, 'draft', v_actor)
  returning * into v_committee;

  perform public.write_club_audit_log(
    'COMMITTEE_CREATED',
    'committee',
    v_committee.id,
    null,
    jsonb_build_object('name', v_committee.name, 'session', v_committee.session_label)
  );

  return query select v_committee.id, v_committee.status;
end;
$$;

create or replace function public.assign_committee_member(
  p_committee_id uuid,
  p_profile_id uuid,
  p_position_id uuid,
  p_start_date date default current_date,
  p_reason text default null
)
returns table(committee_membership_id uuid, position_assignment_id uuid, status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_committee public.committees%rowtype;
  v_position public.club_positions%rowtype;
  v_assignment_id uuid;
  v_membership public.committee_memberships%rowtype;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_is_primary boolean := true;
begin
  if v_actor is null or not public.can_manage_committees() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if p_profile_id = v_actor then
    raise exception 'Self leadership assignment is not allowed' using errcode = '42501';
  end if;

  select * into v_committee
  from public.committees
  where id = p_committee_id
  for update;

  if not found then
    raise exception 'Committee not found' using errcode = 'P0002';
  end if;

  if v_committee.status not in ('draft', 'active') then
    raise exception 'Only draft or active committees can receive members' using errcode = '22023';
  end if;

  select * into v_position
  from public.club_positions
  where id = p_position_id
    and status = 'active'
    and archived_at is null
  for update;

  if not found then
    raise exception 'Position must be active' using errcode = '22023';
  end if;

  v_is_primary := v_position.is_core_panel or v_position.slug like 'head-%' or v_position.slug in ('treasurer');

  if v_is_primary and exists (
    select 1
    from public.committee_memberships
    where committee_id = p_committee_id
      and club_position_id = p_position_id
      and status = 'active'
  ) then
    raise exception 'This position already has an active committee member' using errcode = '23505';
  end if;

  select assigned.assignment_id into v_assignment_id
  from public.assign_club_position(
    p_profile_id,
    p_position_id,
    v_is_primary,
    coalesce(p_start_date, current_date),
    coalesce(v_reason, 'Assigned through committee management')
  ) assigned;

  insert into public.committee_memberships (
    committee_id,
    volunteer_profile_id,
    club_position_id,
    volunteer_club_position_id,
    is_primary_position,
    assigned_date,
    assigned_by,
    start_date,
    status,
    reason
  )
  values (
    p_committee_id,
    p_profile_id,
    p_position_id,
    v_assignment_id,
    v_is_primary,
    current_date,
    v_actor,
    coalesce(p_start_date, current_date),
    'active',
    v_reason
  )
  returning * into v_membership;

  perform public.write_club_audit_log(
    'COMMITTEE_MEMBER_ASSIGNED',
    'committee',
    p_committee_id,
    null,
    jsonb_build_object(
      'committee_member', v_membership.id,
      'target_volunteer', p_profile_id,
      'new_position', p_position_id,
      'position_assignment', v_assignment_id,
      'reason', v_reason
    )
  );

  perform public.write_club_audit_log(
    'LEADERSHIP_CHANGED',
    'volunteer_profile',
    p_profile_id,
    null,
    jsonb_build_object('committee', p_committee_id, 'new_position', p_position_id, 'reason', v_reason)
  );

  return query select v_membership.id, v_assignment_id, v_membership.status;
end;
$$;

create or replace function public.activate_committee(p_committee_id uuid, p_reason text default null)
returns table(committee_id uuid, status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_committee public.committees%rowtype;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if v_actor is null or not public.can_manage_committees() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into v_committee from public.committees where id = p_committee_id for update;
  if not found then
    raise exception 'Committee not found' using errcode = 'P0002';
  end if;

  if v_committee.status not in ('draft', 'active') then
    raise exception 'Only draft committees can be activated' using errcode = '22023';
  end if;

  update public.committee_memberships
  set status = 'archived',
      end_date = coalesce(end_date, coalesce(v_committee.start_date, current_date)),
      ended_by = v_actor,
      ended_at = now(),
      archived_at = now(),
      reason = coalesce(reason, 'Archived when a new committee became active')
  where committee_id in (select id from public.committees where status = 'active' and id <> p_committee_id)
    and status = 'active';

  update public.committees
  set status = 'archived',
      archived_by = v_actor,
      archived_at = now(),
      end_date = coalesce(end_date, v_committee.start_date)
  where status = 'active'
    and id <> p_committee_id;

  update public.committees
  set status = 'active',
      activated_by = v_actor,
      activated_at = coalesce(activated_at, now()),
      archived_by = null,
      archived_at = null
  where id = p_committee_id;

  perform public.write_club_audit_log(
    'COMMITTEE_ACTIVATED',
    'committee',
    p_committee_id,
    null,
    jsonb_build_object('reason', v_reason)
  );

  return query select p_committee_id, 'active'::text;
end;
$$;

create or replace function public.end_committee_member(
  p_committee_membership_id uuid,
  p_end_date date default current_date,
  p_reason text default null
)
returns table(committee_membership_id uuid, status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_membership public.committee_memberships%rowtype;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if v_actor is null or not public.can_manage_committees() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if v_reason is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  select * into v_membership
  from public.committee_memberships
  where id = p_committee_membership_id
  for update;

  if not found then
    raise exception 'Committee member not found' using errcode = 'P0002';
  end if;

  if v_membership.status <> 'active' then
    raise exception 'Only active committee members can be ended' using errcode = '22023';
  end if;

  update public.committee_memberships
  set status = 'ended',
      end_date = coalesce(p_end_date, current_date),
      ended_by = v_actor,
      ended_at = now(),
      reason = v_reason
  where id = p_committee_membership_id;

  if v_membership.volunteer_club_position_id is not null then
    perform public.end_club_position(v_membership.volunteer_club_position_id, coalesce(p_end_date, current_date), v_reason);
  end if;

  perform public.write_club_audit_log(
    'COMMITTEE_MEMBER_REMOVED',
    'committee',
    v_membership.committee_id,
    null,
    jsonb_build_object(
      'committee_member', p_committee_membership_id,
      'target_volunteer', v_membership.volunteer_profile_id,
      'old_position', v_membership.club_position_id,
      'reason', v_reason
    )
  );

  return query select p_committee_membership_id, 'ended'::text;
end;
$$;

create or replace function public.complete_committee(p_committee_id uuid, p_reason text default null)
returns table(committee_id uuid, status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_member record;
begin
  if v_actor is null or not public.can_manage_committees() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if v_reason is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  if not exists (select 1 from public.committees where id = p_committee_id and status in ('active', 'draft')) then
    raise exception 'Committee is not completable' using errcode = '22023';
  end if;

  for v_member in
    select id from public.committee_memberships
    where committee_id = p_committee_id and status = 'active'
  loop
    perform public.end_committee_member(v_member.id, current_date, v_reason);
  end loop;

  update public.committees
  set status = 'completed',
      completed_by = v_actor,
      completed_at = now(),
      end_date = coalesce(end_date, current_date)
  where id = p_committee_id;

  perform public.write_club_audit_log('COMMITTEE_COMPLETED', 'committee', p_committee_id, null, jsonb_build_object('reason', v_reason));
  return query select p_committee_id, 'completed'::text;
end;
$$;

create or replace function public.archive_committee(p_committee_id uuid, p_reason text default null)
returns table(committee_id uuid, status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if v_actor is null or not public.can_manage_committees() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if v_reason is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  if not exists (select 1 from public.committees where id = p_committee_id) then
    raise exception 'Committee not found' using errcode = 'P0002';
  end if;

  update public.committee_memberships
  set status = case when status = 'active' then 'archived' else status end,
      end_date = coalesce(end_date, current_date),
      ended_by = coalesce(ended_by, v_actor),
      ended_at = coalesce(ended_at, now()),
      archived_at = coalesce(archived_at, now()),
      reason = coalesce(reason, v_reason)
  where committee_id = p_committee_id;

  update public.committees
  set status = 'archived',
      archived_by = v_actor,
      archived_at = now(),
      end_date = coalesce(end_date, current_date)
  where id = p_committee_id;

  perform public.write_club_audit_log('COMMITTEE_ARCHIVED', 'committee', p_committee_id, null, jsonb_build_object('reason', v_reason));
  return query select p_committee_id, 'archived'::text;
end;
$$;

create or replace function public.get_active_committee_public()
returns table(
  committee_id uuid,
  committee_name text,
  session_label text,
  start_date date,
  end_date date,
  member_name text,
  position_name text,
  position_slug text,
  is_core_panel boolean,
  display_order integer
)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select
    committee.id,
    committee.name,
    committee.session_label,
    committee.start_date,
    committee.end_date,
    profile.full_name,
    position.name,
    position.slug,
    position.is_core_panel,
    position.display_order
  from public.committees committee
  join public.committee_memberships membership on membership.committee_id = committee.id
  join public.volunteer_profiles profile on profile.id = membership.volunteer_profile_id
  join public.club_positions position on position.id = membership.club_position_id
  where committee.status = 'active'
    and membership.status = 'active'
    and profile.account_status = 'approved'
    and profile.archived_at is null
  order by position.display_order, position.name, profile.full_name
$$;

alter table public.committees enable row level security;
alter table public.committee_memberships enable row level security;

revoke all on table public.committees from anon, authenticated;
revoke all on table public.committee_memberships from anon, authenticated;

grant select on table public.committees to anon, authenticated;
grant select on table public.committee_memberships to anon, authenticated;

drop policy if exists "Public can read active committees" on public.committees;
create policy "Public can read active committees" on public.committees
for select to anon, authenticated
using (status = 'active');

drop policy if exists "Committee admins can read committees" on public.committees;
create policy "Committee admins can read committees" on public.committees
for select to authenticated
using (public.can_view_committees());

drop policy if exists "Public can read active committee memberships" on public.committee_memberships;
create policy "Public can read active committee memberships" on public.committee_memberships
for select to anon, authenticated
using (
  exists (
    select 1 from public.committees
    where committees.id = committee_memberships.committee_id
      and committees.status = 'active'
  )
);

drop policy if exists "Committee admins can read committee memberships" on public.committee_memberships;
create policy "Committee admins can read committee memberships" on public.committee_memberships
for select to authenticated
using (public.can_view_committees());

revoke all on function public.can_view_committees() from anon, public;
revoke all on function public.can_manage_committees() from anon, public;
revoke all on function public.create_committee(text, text, date, date) from anon, public;
revoke all on function public.assign_committee_member(uuid, uuid, uuid, date, text) from anon, public;
revoke all on function public.activate_committee(uuid, text) from anon, public;
revoke all on function public.end_committee_member(uuid, date, text) from anon, public;
revoke all on function public.complete_committee(uuid, text) from anon, public;
revoke all on function public.archive_committee(uuid, text) from anon, public;
revoke all on function public.get_active_committee_public() from public;

grant execute on function public.can_view_committees() to authenticated;
grant execute on function public.can_manage_committees() to authenticated;
grant execute on function public.create_committee(text, text, date, date) to authenticated;
grant execute on function public.assign_committee_member(uuid, uuid, uuid, date, text) to authenticated;
grant execute on function public.activate_committee(uuid, text) to authenticated;
grant execute on function public.end_committee_member(uuid, date, text) to authenticated;
grant execute on function public.complete_committee(uuid, text) to authenticated;
grant execute on function public.archive_committee(uuid, text) to authenticated;
grant execute on function public.get_active_committee_public() to anon, authenticated;

select public.write_club_audit_log(
  'committee_management.lifecycle_installed',
  'committee',
  null,
  null,
  jsonb_build_object('phase', 'Committee Management', 'history_model', 'volunteer_club_positions')
);
