-- Exact Volunteer Department attendance API requested by the staff workflow.
-- Keeps compatibility with the broader attendance foundation while exposing
-- volunteer_events, volunteer_attendance, and concise RPC names.

create table if not exists public.volunteer_events (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.club_departments(id) on delete restrict,
  name text not null,
  event_date date not null,
  location text,
  source_event_id uuid references public.events(id) on delete set null,
  status text not null default 'active',
  created_by uuid references public.volunteer_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint volunteer_events_name_check check (length(btrim(name)) >= 3),
  constraint volunteer_events_status_check check (status in ('active', 'completed', 'archived'))
);

create table if not exists public.volunteer_attendance (
  id uuid primary key default gen_random_uuid(),
  serial integer not null,
  member_id uuid not null references public.volunteer_profiles(id) on delete restrict,
  event_id uuid not null references public.volunteer_events(id) on delete cascade,
  attendance_type text not null,
  time_slot tsrange,
  present boolean,
  remarks text,
  recorded_by uuid references public.volunteer_profiles(id) on delete set null,
  recorded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint volunteer_attendance_type_check check (attendance_type in ('meeting', 'booth')),
  constraint volunteer_attendance_serial_check check (serial > 0),
  constraint volunteer_attendance_booth_timeslot_check check (
    (attendance_type = 'booth' and time_slot is not null)
    or (attendance_type = 'meeting' and time_slot is null)
  ),
  constraint volunteer_attendance_remarks_length_check check (remarks is null or length(remarks) <= 500)
);

create index if not exists volunteer_events_department_date_idx
on public.volunteer_events (department_id, event_date desc);

create unique index if not exists volunteer_attendance_one_meeting_row_idx
on public.volunteer_attendance (member_id, event_id, attendance_type)
where time_slot is null;

create unique index if not exists volunteer_attendance_one_booth_slot_row_idx
on public.volunteer_attendance (member_id, event_id, attendance_type, lower(time_slot), upper(time_slot))
where time_slot is not null;

create index if not exists volunteer_attendance_event_type_idx
on public.volunteer_attendance (event_id, attendance_type);

drop trigger if exists set_volunteer_events_updated_at on public.volunteer_events;
create trigger set_volunteer_events_updated_at
before update on public.volunteer_events
for each row execute function public.set_updated_at();

drop trigger if exists set_volunteer_attendance_updated_at on public.volunteer_attendance;
create trigger set_volunteer_attendance_updated_at
before update on public.volunteer_attendance
for each row execute function public.set_updated_at();

create or replace function public.volunteer_department_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select id
  from public.club_departments
  where slug = 'volunteer-management'
    and status = 'active'
    and archived_at is null
  limit 1;
$$;

create or replace function public.can_view_volunteer_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.volunteer_events event
    where event.id = p_event_id
      and event.archived_at is null
      and public.can_view_volunteer_department(event.department_id)
  );
$$;

create or replace function public.can_manage_volunteer_event_attendance(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.volunteer_events event
    where event.id = p_event_id
      and event.archived_at is null
      and public.can_manage_volunteer_department_attendance(event.department_id)
  );
$$;

create or replace function public.create_missing_event(name text, date date)
returns table(event_id uuid)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_department_id uuid := public.volunteer_department_id();
  v_event public.volunteer_events%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if v_department_id is null then
    raise exception 'Volunteer Department is not configured' using errcode = 'P0002';
  end if;

  if not public.can_manage_volunteer_department_attendance(v_department_id) then
    raise exception 'Not authorized to create volunteer events' using errcode = '42501';
  end if;

  insert into public.volunteer_events (department_id, name, event_date, created_by)
  values (v_department_id, btrim(name), coalesce(date, current_date), v_actor)
  returning * into v_event;

  perform public.write_club_audit_log(
    'VOLUNTEER_EVENT_CREATED',
    'volunteer_event',
    v_event.id,
    v_department_id,
    jsonb_build_object('name', v_event.name, 'date', v_event.event_date)
  );

  return query select v_event.id;
end;
$$;

create or replace function public.fetch_volunteer_events()
returns table(
  event_id uuid,
  name text,
  event_date date,
  location text,
  status text
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_department_id uuid := public.volunteer_department_id();
begin
  if v_department_id is null or not public.can_view_volunteer_department(v_department_id) then
    raise exception 'Not authorized to view volunteer events' using errcode = '42501';
  end if;

  return query
  select event.id, event.name, event.event_date, event.location, event.status
  from public.volunteer_events event
  where event.department_id = v_department_id
    and event.archived_at is null
  union all
  select source.id, source.title, source.event_date, source.location, source.status
  from public.events source
  join public.event_department_assignments assignment on assignment.event_id = source.id
  where assignment.department_id = v_department_id
    and assignment.assignment_status <> 'cancelled'
    and source.status <> 'archived'
    and not exists (
      select 1 from public.volunteer_events existing
      where existing.source_event_id = source.id
        and existing.archived_at is null
    )
  order by event_date desc, name asc;
end;
$$;

create or replace function public.fetch_event_members(event_id uuid, attendance_type text)
returns table(
  serial integer,
  member_id uuid,
  picture text,
  full_name text,
  student_id text,
  member_type text,
  present boolean,
  absent boolean,
  remarks text,
  time_slot tsrange,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_event public.volunteer_events%rowtype;
  v_type text := coalesce(nullif(attendance_type, ''), 'meeting');
begin
  if v_type not in ('meeting', 'booth') then
    raise exception 'Invalid attendance type' using errcode = '22023';
  end if;

  select * into v_event
  from public.volunteer_events event
  where event.id = fetch_event_members.event_id
    and event.archived_at is null;

  if not found then
    raise exception 'Volunteer event not found' using errcode = 'P0002';
  end if;

  if not public.can_view_volunteer_department(v_event.department_id) then
    raise exception 'Not authorized to view attendance' using errcode = '42501';
  end if;

  return query
  with members as (
    select
      public.ensure_volunteer_department_member_serial(v_event.department_id, profile.id, public.current_volunteer_profile_id()) as serial,
      profile.id as member_id,
      profile.profile_photo_path,
      profile.full_name,
      profile.student_id,
      case
        when membership.department_role in ('department_head', 'deputy_head', 'coordinator', 'executive') then 'Panel'
        else 'General'
      end as member_type
    from public.volunteer_department_memberships membership
    join public.volunteer_profiles profile on profile.id = membership.volunteer_profile_id
    where membership.department_id = v_event.department_id
      and membership.membership_status = 'approved'
      and profile.account_status = 'approved'
      and profile.archived_at is null
  ),
  latest_attendance as (
    select distinct on (attendance.member_id)
      attendance.member_id,
      attendance.present,
      attendance.remarks,
      attendance.time_slot,
      attendance.updated_at
    from public.volunteer_attendance attendance
    where attendance.event_id = fetch_event_members.event_id
      and attendance.attendance_type = v_type
    order by attendance.member_id, attendance.updated_at desc
  )
  select
    members.serial,
    members.member_id,
    members.profile_photo_path,
    members.full_name,
    members.student_id,
    members.member_type,
    latest_attendance.present,
    latest_attendance.present is false,
    latest_attendance.remarks,
    latest_attendance.time_slot,
    latest_attendance.updated_at
  from members
  left join latest_attendance on latest_attendance.member_id = members.member_id
  order by members.serial asc, members.full_name asc;
end;
$$;

create or replace function public.save_attendance(event_id uuid, attendance_type text, attendance_data jsonb)
returns table(saved_count integer)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_event public.volunteer_events%rowtype;
  v_type text := coalesce(nullif(attendance_type, ''), 'meeting');
  v_item jsonb;
  v_member_id uuid;
  v_present boolean;
  v_absent boolean;
  v_present_value boolean;
  v_remarks text;
  v_time_slot tsrange;
  v_serial integer;
  v_saved integer := 0;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if v_type not in ('meeting', 'booth') then
    raise exception 'Invalid attendance type' using errcode = '22023';
  end if;

  select * into v_event
  from public.volunteer_events event
  where event.id = save_attendance.event_id
    and event.archived_at is null
  for update;

  if not found then
    raise exception 'Volunteer event not found' using errcode = 'P0002';
  end if;

  if not public.can_manage_volunteer_department_attendance(v_event.department_id) then
    raise exception 'Not authorized to save attendance' using errcode = '42501';
  end if;

  if jsonb_typeof(attendance_data) <> 'array' then
    raise exception 'attendance_data must be a JSON array' using errcode = '22023';
  end if;

  for v_item in select * from jsonb_array_elements(attendance_data)
  loop
    v_member_id := nullif(v_item->>'memberId', '')::uuid;
    v_present := coalesce((v_item->>'present')::boolean, false);
    v_absent := coalesce((v_item->>'absent')::boolean, false);
    v_remarks := nullif(btrim(coalesce(v_item->>'remarks', '')), '');
    v_time_slot := case
      when v_type = 'booth' and nullif(v_item->>'timeSlot', '') is not null then (v_item->>'timeSlot')::tsrange
      when v_type = 'booth' then tsrange(now()::timestamp, (now() + interval '1 hour')::timestamp, '[)')
      else null
    end;

    if v_present and v_absent then
      raise exception 'Present and absent cannot both be selected' using errcode = '22023';
    end if;

    v_present_value := case
      when v_present then true
      when v_absent then false
      else null
    end;

    if not exists (
      select 1
      from public.volunteer_department_memberships membership
      where membership.department_id = v_event.department_id
        and membership.volunteer_profile_id = v_member_id
        and membership.membership_status = 'approved'
    ) then
      raise exception 'Member is not assigned to the Volunteer Department' using errcode = '42501';
    end if;

    v_serial := public.ensure_volunteer_department_member_serial(v_event.department_id, v_member_id, v_actor);

    if v_type = 'meeting' then
      insert into public.volunteer_attendance (
        serial, member_id, event_id, attendance_type, time_slot, present, remarks, recorded_by, recorded_at
      )
      values (v_serial, v_member_id, save_attendance.event_id, v_type, null, v_present_value, v_remarks, v_actor, now())
      on conflict (member_id, event_id, attendance_type) where time_slot is null
      do update set
        present = excluded.present,
        remarks = excluded.remarks,
        recorded_by = excluded.recorded_by,
        recorded_at = excluded.recorded_at,
        updated_at = now();
    else
      insert into public.volunteer_attendance (
        serial, member_id, event_id, attendance_type, time_slot, present, remarks, recorded_by, recorded_at
      )
      values (v_serial, v_member_id, save_attendance.event_id, v_type, v_time_slot, v_present_value, v_remarks, v_actor, now())
      on conflict (member_id, event_id, attendance_type, lower(time_slot), upper(time_slot)) where time_slot is not null
      do update set
        present = excluded.present,
        remarks = excluded.remarks,
        recorded_by = excluded.recorded_by,
        recorded_at = excluded.recorded_at,
        updated_at = now();
    end if;

    v_saved := v_saved + 1;
  end loop;

  perform public.write_club_audit_log(
    'VOLUNTEER_ATTENDANCE_SAVED',
    'volunteer_event',
    save_attendance.event_id,
    v_event.department_id,
    jsonb_build_object('attendance_type', v_type, 'saved_count', v_saved)
  );

  return query select v_saved;
end;
$$;

create or replace function public.fetch_attendance_metrics(event_id uuid)
returns table(
  total_members bigint,
  present_count bigint,
  absent_count bigint,
  unmarked_count bigint,
  most_active_member text,
  most_active_member_id uuid,
  most_irregular_member text,
  most_irregular_member_id uuid
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_event public.volunteer_events%rowtype;
begin
  select * into v_event
  from public.volunteer_events event
  where event.id = fetch_attendance_metrics.event_id
    and event.archived_at is null;

  if not found then
    raise exception 'Volunteer event not found' using errcode = 'P0002';
  end if;

  if not public.can_view_volunteer_department(v_event.department_id) then
    raise exception 'Not authorized to view attendance metrics' using errcode = '42501';
  end if;

  return query
  with members as (
    select membership.volunteer_profile_id
    from public.volunteer_department_memberships membership
    join public.volunteer_profiles profile on profile.id = membership.volunteer_profile_id
    where membership.department_id = v_event.department_id
      and membership.membership_status = 'approved'
      and profile.account_status = 'approved'
      and profile.archived_at is null
  ),
  current_rows as (
    select distinct on (attendance.member_id)
      attendance.member_id,
      attendance.present
    from public.volunteer_attendance attendance
    where attendance.event_id = fetch_attendance_metrics.event_id
    order by attendance.member_id, attendance.updated_at desc
  ),
  history as (
    select
      profile.id,
      profile.full_name,
      count(*) filter (where attendance.present is true)::numeric as present_total,
      count(*) filter (where attendance.present is not null)::numeric as marked_total
    from public.volunteer_attendance attendance
    join public.volunteer_events event on event.id = attendance.event_id
    join public.volunteer_profiles profile on profile.id = attendance.member_id
    where event.department_id = v_event.department_id
    group by profile.id, profile.full_name
  ),
  ranked as (
    select
      id,
      full_name,
      case when marked_total = 0 then null else present_total / marked_total end as presence_rate,
      marked_total
    from history
    where marked_total > 0
  )
  select
    (select count(*) from members)::bigint,
    (select count(*) from current_rows where current_rows.present is true)::bigint,
    (select count(*) from current_rows where current_rows.present is false)::bigint,
    greatest((select count(*) from members) - (select count(*) from current_rows where current_rows.present is not null), 0)::bigint,
    (select full_name from ranked order by presence_rate desc, marked_total desc, full_name asc limit 1),
    (select id from ranked order by presence_rate desc, marked_total desc, full_name asc limit 1),
    (select full_name from ranked order by presence_rate asc, marked_total desc, full_name asc limit 1),
    (select id from ranked order by presence_rate asc, marked_total desc, full_name asc limit 1);
end;
$$;

alter table public.volunteer_events enable row level security;
alter table public.volunteer_attendance enable row level security;

revoke all on table public.volunteer_events from anon, authenticated;
revoke all on table public.volunteer_attendance from anon, authenticated;

grant select on table public.volunteer_events to authenticated;
grant select on table public.volunteer_attendance to authenticated;

drop policy if exists "Scoped staff can read volunteer events" on public.volunteer_events;
create policy "Scoped staff can read volunteer events"
on public.volunteer_events for select to authenticated
using (public.can_view_volunteer_department(department_id));

drop policy if exists "Scoped staff can read volunteer attendance" on public.volunteer_attendance;
create policy "Scoped staff can read volunteer attendance"
on public.volunteer_attendance for select to authenticated
using (public.can_view_volunteer_event(event_id));

revoke all on function public.volunteer_department_id() from anon, public;
revoke all on function public.can_view_volunteer_event(uuid) from anon, public;
revoke all on function public.can_manage_volunteer_event_attendance(uuid) from anon, public;
revoke all on function public.create_missing_event(text, date) from anon, public;
revoke all on function public.fetch_volunteer_events() from anon, public;
revoke all on function public.fetch_event_members(uuid, text) from anon, public;
revoke all on function public.save_attendance(uuid, text, jsonb) from anon, public;
revoke all on function public.fetch_attendance_metrics(uuid) from anon, public;

grant execute on function public.volunteer_department_id() to authenticated;
grant execute on function public.can_view_volunteer_event(uuid) to authenticated;
grant execute on function public.can_manage_volunteer_event_attendance(uuid) to authenticated;
grant execute on function public.create_missing_event(text, date) to authenticated;
grant execute on function public.fetch_volunteer_events() to authenticated;
grant execute on function public.fetch_event_members(uuid, text) to authenticated;
grant execute on function public.save_attendance(uuid, text, jsonb) to authenticated;
grant execute on function public.fetch_attendance_metrics(uuid) to authenticated;
