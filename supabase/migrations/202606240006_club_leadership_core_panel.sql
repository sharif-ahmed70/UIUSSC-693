-- UIUSSC Phase CM-3.2: leadership, Core Panel, and optional department onboarding
-- Version: 202606240006

create table if not exists public.club_positions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  is_core_panel boolean not null default false,
  status text not null default 'active',
  display_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint club_positions_slug_unique unique (slug),
  constraint club_positions_status_check check (status in ('active', 'inactive', 'archived')),
  constraint club_positions_display_order_check check (display_order >= 0),
  constraint club_positions_slug_check check (slug = lower(btrim(slug)) and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint club_positions_archive_consistency_check check (
    (status = 'archived' and archived_at is not null)
    or (status <> 'archived')
  )
);

create table if not exists public.volunteer_club_positions (
  id uuid primary key default gen_random_uuid(),
  volunteer_profile_id uuid not null references public.volunteer_profiles(id) on delete restrict,
  club_position_id uuid not null references public.club_positions(id) on delete restrict,
  status text not null default 'active',
  is_primary boolean not null default false,
  term_start date not null default current_date,
  term_end date,
  assigned_by uuid references public.volunteer_profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  ended_by uuid references public.volunteer_profiles(id) on delete set null,
  ended_at timestamptz,
  revoked_by uuid references public.volunteer_profiles(id) on delete set null,
  revoked_at timestamptz,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint volunteer_club_positions_status_check check (status in ('active', 'completed', 'revoked', 'inactive')),
  constraint volunteer_club_positions_term_check check (term_end is null or term_end >= term_start),
  constraint volunteer_club_positions_no_self_assign check (assigned_by is null or assigned_by <> volunteer_profile_id),
  constraint volunteer_club_positions_no_self_end check (ended_by is null or ended_by <> volunteer_profile_id),
  constraint volunteer_club_positions_no_self_revoke check (revoked_by is null or revoked_by <> volunteer_profile_id)
);

drop trigger if exists set_club_positions_updated_at on public.club_positions;
create trigger set_club_positions_updated_at
before update on public.club_positions
for each row execute function public.set_updated_at();

drop trigger if exists set_volunteer_club_positions_updated_at on public.volunteer_club_positions;
create trigger set_volunteer_club_positions_updated_at
before update on public.volunteer_club_positions
for each row execute function public.set_updated_at();

create index if not exists club_positions_status_idx on public.club_positions (status);
create index if not exists club_positions_display_order_idx on public.club_positions (display_order);
create index if not exists volunteer_club_positions_profile_idx on public.volunteer_club_positions (volunteer_profile_id);
create index if not exists volunteer_club_positions_position_idx on public.volunteer_club_positions (club_position_id);
create index if not exists volunteer_club_positions_status_idx on public.volunteer_club_positions (status);
create unique index if not exists volunteer_club_positions_one_active_position_idx
on public.volunteer_club_positions (volunteer_profile_id, club_position_id)
where status = 'active';
create unique index if not exists volunteer_club_positions_one_active_primary_idx
on public.volunteer_club_positions (volunteer_profile_id)
where status = 'active' and is_primary = true;

insert into public.club_positions (name, slug, description, is_core_panel, display_order)
values
  ('President', 'president', 'Official UIUSSC President position.', true, 10),
  ('Vice President', 'vice-president', 'Official UIUSSC Vice President position.', true, 20),
  ('General Secretary', 'general-secretary', 'Official UIUSSC General Secretary position.', true, 30),
  ('Joint Secretary', 'joint-secretary', 'Official UIUSSC Joint Secretary position.', true, 40),
  ('Treasurer', 'treasurer', 'Official UIUSSC Treasurer position.', true, 50),
  ('Organizing Secretary', 'organizing-secretary', 'Official UIUSSC Organizing Secretary position.', true, 60),
  ('Executive Member', 'executive-member', 'Official UIUSSC Executive Member position.', true, 70)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  is_core_panel = excluded.is_core_panel,
  display_order = excluded.display_order,
  status = 'active',
  archived_at = null;

alter table public.club_positions enable row level security;
alter table public.volunteer_club_positions enable row level security;

revoke all on table public.club_positions from anon, authenticated;
revoke all on table public.volunteer_club_positions from anon, authenticated;

grant select (
  id,
  name,
  slug,
  description,
  is_core_panel,
  status,
  display_order
) on public.club_positions to anon, authenticated;

grant select (
  id,
  volunteer_profile_id,
  club_position_id,
  status,
  is_primary,
  term_start,
  term_end,
  assigned_at,
  ended_at,
  revoked_at,
  reason,
  created_at,
  updated_at
) on public.volunteer_club_positions to authenticated;

drop policy if exists "Public can read active club position metadata" on public.club_positions;
create policy "Public can read active club position metadata"
on public.club_positions
for select
to anon, authenticated
using (status = 'active' and archived_at is null);

drop policy if exists "Admins can read all club positions" on public.club_positions;
create policy "Admins can read all club positions"
on public.club_positions
for select
to authenticated
using (public.can_manage_volunteers() or public.can_manage_departments());

drop policy if exists "Authenticated users can read own club positions" on public.volunteer_club_positions;
create policy "Authenticated users can read own club positions"
on public.volunteer_club_positions
for select
to authenticated
using (
  exists (
    select 1
    from public.volunteer_profiles
    where volunteer_profiles.id = volunteer_club_positions.volunteer_profile_id
      and volunteer_profiles.auth_user_id = auth.uid()
  )
);

drop policy if exists "Admins can read volunteer club positions" on public.volunteer_club_positions;
create policy "Admins can read volunteer club positions"
on public.volunteer_club_positions
for select
to authenticated
using (public.can_manage_volunteers());

create or replace function public.create_club_position(
  p_name text,
  p_slug text,
  p_description text default null,
  p_is_core_panel boolean default false,
  p_display_order integer default 0
)
returns table(position_id uuid, slug text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_position public.club_positions%rowtype;
  v_slug text := lower(regexp_replace(btrim(p_slug), '[^a-zA-Z0-9]+', '-', 'g'));
begin
  if v_actor is null or not public.has_any_active_platform_role(array['super_admin', 'club_admin']) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  v_slug := regexp_replace(v_slug, '(^-|-$)', '', 'g');

  if nullif(btrim(coalesce(p_name, '')), '') is null or nullif(v_slug, '') is null then
    raise exception 'Position name and slug are required' using errcode = '22023';
  end if;

  insert into public.club_positions (name, slug, description, is_core_panel, display_order, status)
  values (btrim(p_name), v_slug, nullif(btrim(coalesce(p_description, '')), ''), coalesce(p_is_core_panel, false), greatest(coalesce(p_display_order, 0), 0), 'active')
  returning * into v_position;

  perform public.write_club_audit_log('club_position.create', 'club_position', v_position.id, null, jsonb_build_object('slug', v_position.slug, 'is_core_panel', v_position.is_core_panel));

  return query select v_position.id, v_position.slug;
end;
$$;

create or replace function public.update_club_position(
  p_position_id uuid,
  p_name text,
  p_slug text,
  p_description text,
  p_is_core_panel boolean,
  p_status text,
  p_display_order integer,
  p_reason text default null
)
returns table(position_id uuid, slug text, status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_position public.club_positions%rowtype;
  v_slug text := lower(regexp_replace(btrim(p_slug), '[^a-zA-Z0-9]+', '-', 'g'));
begin
  if v_actor is null or not public.has_any_active_platform_role(array['super_admin', 'club_admin']) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if p_status not in ('active', 'inactive') then
    raise exception 'Invalid position status for update' using errcode = '22023';
  end if;

  v_slug := regexp_replace(v_slug, '(^-|-$)', '', 'g');

  select * into v_position from public.club_positions where id = p_position_id for update;

  if not found then
    raise exception 'Position not found' using errcode = 'P0002';
  end if;

  if v_position.status = 'archived' then
    raise exception 'Archived positions cannot be edited' using errcode = '22023';
  end if;

  update public.club_positions
  set
    name = btrim(p_name),
    slug = v_slug,
    description = nullif(btrim(coalesce(p_description, '')), ''),
    is_core_panel = coalesce(p_is_core_panel, false),
    status = p_status,
    display_order = greatest(coalesce(p_display_order, 0), 0)
  where id = p_position_id;

  perform public.write_club_audit_log('club_position.update', 'club_position', p_position_id, null, jsonb_build_object('previous_slug', v_position.slug, 'new_slug', v_slug, 'reason', nullif(btrim(coalesce(p_reason, '')), '')));

  return query select p_position_id, v_slug, p_status;
end;
$$;

create or replace function public.archive_club_position(p_position_id uuid, p_reason text)
returns table(position_id uuid, status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_position public.club_positions%rowtype;
begin
  if v_actor is null or not public.has_any_active_platform_role(array['super_admin', 'club_admin']) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  select * into v_position from public.club_positions where id = p_position_id for update;

  if not found then
    raise exception 'Position not found' using errcode = 'P0002';
  end if;

  update public.club_positions
  set status = 'archived', archived_at = coalesce(archived_at, now())
  where id = p_position_id;

  perform public.write_club_audit_log('club_position.archive', 'club_position', p_position_id, null, jsonb_build_object('previous_status', v_position.status, 'reason', btrim(p_reason)));

  return query select p_position_id, 'archived'::text;
end;
$$;

create or replace function public.assign_volunteer_club_position(
  p_profile_id uuid,
  p_position_id uuid,
  p_is_primary boolean default true,
  p_term_start date default current_date,
  p_reason text default null
)
returns table(assignment_id uuid, status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_assignment public.volunteer_club_positions%rowtype;
begin
  if v_actor is null or not public.has_any_active_platform_role(array['super_admin', 'club_admin']) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if p_profile_id = v_actor then
    raise exception 'Self position assignment is not allowed' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.volunteer_profiles
    where id = p_profile_id
      and account_status = 'approved'
      and onboarding_status = 'approved'
      and archived_at is null
  ) then
    raise exception 'Target profile must be approved' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.club_positions
    where id = p_position_id
      and status = 'active'
      and archived_at is null
  ) then
    raise exception 'Position must be active' using errcode = '22023';
  end if;

  if coalesce(p_is_primary, true) then
    update public.volunteer_club_positions
    set is_primary = false
    where volunteer_profile_id = p_profile_id
      and status = 'active';
  end if;

  insert into public.volunteer_club_positions (
    volunteer_profile_id,
    club_position_id,
    status,
    is_primary,
    term_start,
    assigned_by,
    reason
  )
  values (
    p_profile_id,
    p_position_id,
    'active',
    coalesce(p_is_primary, true),
    coalesce(p_term_start, current_date),
    v_actor,
    nullif(btrim(coalesce(p_reason, '')), '')
  )
  returning * into v_assignment;

  perform public.write_club_audit_log('volunteer_club_position.assign', 'volunteer_profile', p_profile_id, null, jsonb_build_object('assignment_id', v_assignment.id, 'position_id', p_position_id, 'is_primary', v_assignment.is_primary));

  return query select v_assignment.id, v_assignment.status;
end;
$$;

create or replace function public.complete_volunteer_club_position(
  p_assignment_id uuid,
  p_term_end date default current_date,
  p_reason text default null
)
returns table(assignment_id uuid, status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_assignment public.volunteer_club_positions%rowtype;
begin
  if v_actor is null or not public.has_any_active_platform_role(array['super_admin', 'club_admin']) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into v_assignment from public.volunteer_club_positions where id = p_assignment_id for update;

  if not found then
    raise exception 'Position assignment not found' using errcode = 'P0002';
  end if;

  if v_assignment.volunteer_profile_id = v_actor then
    raise exception 'Self position completion is not allowed' using errcode = '42501';
  end if;

  if v_assignment.status <> 'active' then
    raise exception 'Only active assignments can be completed' using errcode = '22023';
  end if;

  update public.volunteer_club_positions
  set
    status = 'completed',
    is_primary = false,
    term_end = coalesce(p_term_end, current_date),
    ended_by = v_actor,
    ended_at = now(),
    reason = nullif(btrim(coalesce(p_reason, reason, '')), '')
  where id = p_assignment_id;

  perform public.write_club_audit_log('volunteer_club_position.complete', 'volunteer_profile', v_assignment.volunteer_profile_id, null, jsonb_build_object('assignment_id', p_assignment_id, 'position_id', v_assignment.club_position_id));

  return query select p_assignment_id, 'completed'::text;
end;
$$;

create or replace function public.revoke_volunteer_club_position(
  p_assignment_id uuid,
  p_reason text
)
returns table(assignment_id uuid, status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_assignment public.volunteer_club_positions%rowtype;
begin
  if v_actor is null or not public.has_any_active_platform_role(array['super_admin', 'club_admin']) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  select * into v_assignment from public.volunteer_club_positions where id = p_assignment_id for update;

  if not found then
    raise exception 'Position assignment not found' using errcode = 'P0002';
  end if;

  if v_assignment.volunteer_profile_id = v_actor then
    raise exception 'Self position revocation is not allowed' using errcode = '42501';
  end if;

  update public.volunteer_club_positions
  set status = 'revoked', is_primary = false, revoked_by = v_actor, revoked_at = now(), reason = btrim(p_reason)
  where id = p_assignment_id;

  perform public.write_club_audit_log('volunteer_club_position.revoke', 'volunteer_profile', v_assignment.volunteer_profile_id, null, jsonb_build_object('assignment_id', p_assignment_id, 'position_id', v_assignment.club_position_id));

  return query select p_assignment_id, 'revoked'::text;
end;
$$;

create or replace function public.change_primary_club_position(p_assignment_id uuid, p_reason text default null)
returns table(assignment_id uuid, is_primary boolean)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_assignment public.volunteer_club_positions%rowtype;
begin
  if v_actor is null or not public.has_any_active_platform_role(array['super_admin', 'club_admin']) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into v_assignment from public.volunteer_club_positions where id = p_assignment_id for update;

  if not found then
    raise exception 'Position assignment not found' using errcode = 'P0002';
  end if;

  if v_assignment.status <> 'active' then
    raise exception 'Only active assignments can be primary' using errcode = '22023';
  end if;

  update public.volunteer_club_positions
  set is_primary = false
  where volunteer_profile_id = v_assignment.volunteer_profile_id
    and status = 'active';

  update public.volunteer_club_positions
  set is_primary = true
  where id = p_assignment_id;

  perform public.write_club_audit_log('volunteer_club_position.set_primary', 'volunteer_profile', v_assignment.volunteer_profile_id, null, jsonb_build_object('assignment_id', p_assignment_id, 'reason', nullif(btrim(coalesce(p_reason, '')), '')));

  return query select p_assignment_id, true;
end;
$$;

revoke all on function public.create_club_position(text, text, text, boolean, integer) from public;
revoke all on function public.update_club_position(uuid, text, text, text, boolean, text, integer, text) from public;
revoke all on function public.archive_club_position(uuid, text) from public;
revoke all on function public.assign_volunteer_club_position(uuid, uuid, boolean, date, text) from public;
revoke all on function public.complete_volunteer_club_position(uuid, date, text) from public;
revoke all on function public.revoke_volunteer_club_position(uuid, text) from public;
revoke all on function public.change_primary_club_position(uuid, text) from public;

grant execute on function public.create_club_position(text, text, text, boolean, integer) to authenticated;
grant execute on function public.update_club_position(uuid, text, text, text, boolean, text, integer, text) to authenticated;
grant execute on function public.archive_club_position(uuid, text) to authenticated;
grant execute on function public.assign_volunteer_club_position(uuid, uuid, boolean, date, text) to authenticated;
grant execute on function public.complete_volunteer_club_position(uuid, date, text) to authenticated;
grant execute on function public.revoke_volunteer_club_position(uuid, text) to authenticated;
grant execute on function public.change_primary_club_position(uuid, text) to authenticated;

-- Replace CM-2 onboarding RPC with nullable department support.
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
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if v_auth_email is null or lower(btrim(p_email)) <> v_auth_email then
    raise exception 'Email must match authenticated account' using errcode = '22023';
  end if;

  if nullif(btrim(p_full_name), '') is null
    or nullif(btrim(p_student_id), '') is null
    or nullif(btrim(p_phone), '') is null
    or nullif(btrim(p_academic_department), '') is null
    or nullif(btrim(p_trimester), '') is null then
    raise exception 'Missing required onboarding fields' using errcode = '22023';
  end if;

  if p_blood_group is not null and nullif(btrim(p_blood_group), '') is not null
    and p_blood_group not in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') then
    raise exception 'Invalid blood group' using errcode = '22023';
  end if;

  if p_preferred_department_id is not null and not exists (
    select 1
    from public.club_departments
    where id = p_preferred_department_id
      and status = 'active'
      and archived_at is null
  ) then
    raise exception 'Invalid department request' using errcode = '22023';
  end if;

  select *
  into v_profile
  from public.volunteer_profiles
  where auth_user_id = v_auth_user_id
  for update;

  if found then
    if v_profile.account_status not in ('pending', 'approved') or v_profile.archived_at is not null then
      raise exception 'Profile is not eligible for onboarding updates' using errcode = '42501';
    end if;

    if v_profile.onboarding_status not in ('profile_incomplete', 'submitted', 'under_review', 'approved') then
      raise exception 'Onboarding state cannot be changed by this action' using errcode = '42501';
    end if;

    update public.volunteer_profiles
    set
      full_name = btrim(p_full_name),
      student_id = upper(regexp_replace(btrim(p_student_id), '\s+', '', 'g')),
      email = v_auth_email,
      phone = btrim(p_phone),
      academic_department = btrim(p_academic_department),
      trimester = btrim(p_trimester),
      blood_group = nullif(btrim(p_blood_group), ''),
      onboarding_status = case
        when onboarding_status = 'approved' then onboarding_status
        else 'submitted'
      end
    where id = v_profile.id
    returning * into v_profile;
  else
    insert into public.volunteer_profiles (
      auth_user_id,
      full_name,
      student_id,
      email,
      phone,
      academic_department,
      trimester,
      blood_group,
      account_status,
      onboarding_status
    )
    values (
      v_auth_user_id,
      btrim(p_full_name),
      upper(regexp_replace(btrim(p_student_id), '\s+', '', 'g')),
      v_auth_email,
      btrim(p_phone),
      btrim(p_academic_department),
      btrim(p_trimester),
      nullif(btrim(p_blood_group), ''),
      'pending',
      'submitted'
    )
    returning * into v_profile;
  end if;

  if p_preferred_department_id is null then
    return query
    select
      v_profile.id,
      null::uuid,
      v_profile.onboarding_status,
      null::text;
    return;
  end if;

  select id
  into v_existing_same_department
  from public.volunteer_department_memberships
  where volunteer_profile_id = v_profile.id
    and department_id = p_preferred_department_id
  limit 1;

  select *
  into v_membership
  from public.volunteer_department_memberships
  where volunteer_profile_id = v_profile.id
    and is_primary = true
    and membership_status in ('requested', 'under_review', 'approved')
  for update;

  if found then
    if v_membership.membership_status = 'approved' then
      null;
    elsif v_existing_same_department is not null and v_existing_same_department <> v_membership.id then
      raise exception 'Duplicate department membership request' using errcode = '23505';
    else
      update public.volunteer_department_memberships
      set
        department_id = p_preferred_department_id,
        department_role = 'volunteer',
        membership_status = 'requested',
        requested_at = now(),
        approved_at = null,
        approved_by = null,
        rejected_at = null,
        rejected_by = null,
        rejection_reason = null,
        suspended_at = null,
        suspended_by = null,
        suspension_reason = null,
        removed_at = null,
        removed_by = null,
        removal_reason = null
      where id = v_membership.id
      returning * into v_membership;
    end if;
  else
    if v_existing_same_department is not null then
      raise exception 'Duplicate department membership request' using errcode = '23505';
    end if;

    insert into public.volunteer_department_memberships (
      volunteer_profile_id,
      department_id,
      department_role,
      membership_status,
      is_primary
    )
    values (
      v_profile.id,
      p_preferred_department_id,
      'volunteer',
      'requested',
      true
    )
    returning * into v_membership;
  end if;

  return query
  select
    v_profile.id,
    v_membership.id,
    v_profile.onboarding_status,
    v_membership.membership_status;
end;
$$;
