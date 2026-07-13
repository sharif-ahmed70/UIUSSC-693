-- Volunteer Department dashboard and attendance foundation.
-- Department-scoped attendance events, bulk attendance recording, dashboard RPCs.

create table if not exists public.volunteer_department_attendance_events (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.club_departments(id) on delete restrict,
  event_id uuid references public.events(id) on delete set null,
  title text not null,
  event_date date not null default current_date,
  event_kind text not null default 'meeting',
  location text,
  status text not null default 'active',
  created_by uuid references public.volunteer_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint volunteer_attendance_events_kind_check check (event_kind in ('meeting', 'booth', 'event', 'orientation', 'other')),
  constraint volunteer_attendance_events_status_check check (status in ('active', 'completed', 'archived')),
  constraint volunteer_attendance_events_title_check check (length(btrim(title)) >= 3)
);

create table if not exists public.volunteer_department_member_serials (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.club_departments(id) on delete restrict,
  volunteer_profile_id uuid not null references public.volunteer_profiles(id) on delete restrict,
  serial_number integer not null,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.volunteer_profiles(id) on delete set null,
  constraint volunteer_department_member_serials_serial_check check (serial_number > 0)
);

create table if not exists public.volunteer_attendance_records (
  id uuid primary key default gen_random_uuid(),
  attendance_event_id uuid not null references public.volunteer_department_attendance_events(id) on delete cascade,
  department_id uuid not null references public.club_departments(id) on delete restrict,
  volunteer_profile_id uuid not null references public.volunteer_profiles(id) on delete restrict,
  attendance_status text not null default 'unmarked',
  remarks text,
  recorded_by uuid references public.volunteer_profiles(id) on delete set null,
  recorded_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint volunteer_attendance_records_status_check check (attendance_status in ('unmarked', 'present', 'absent')),
  constraint volunteer_attendance_records_remark_length_check check (remarks is null or length(remarks) <= 500)
);

create table if not exists public.volunteer_booth_attendance_records (
  id uuid primary key default gen_random_uuid(),
  attendance_record_id uuid not null references public.volunteer_attendance_records(id) on delete cascade,
  booth_location text not null,
  timeslot_label text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  attendance_status text not null default 'present',
  remarks text,
  recorded_by uuid references public.volunteer_profiles(id) on delete set null,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint volunteer_booth_attendance_records_status_check check (attendance_status in ('present', 'absent')),
  constraint volunteer_booth_attendance_records_timeslot_check check (length(btrim(timeslot_label)) >= 2),
  constraint volunteer_booth_attendance_records_location_check check (length(btrim(booth_location)) >= 2)
);

create unique index if not exists volunteer_department_member_serials_profile_idx
on public.volunteer_department_member_serials (department_id, volunteer_profile_id);

create unique index if not exists volunteer_department_member_serials_number_idx
on public.volunteer_department_member_serials (department_id, serial_number);

create index if not exists volunteer_attendance_events_department_idx
on public.volunteer_department_attendance_events (department_id, event_date desc);

create index if not exists volunteer_attendance_events_event_idx
on public.volunteer_department_attendance_events (event_id)
where event_id is not null;

create unique index if not exists volunteer_attendance_records_event_profile_idx
on public.volunteer_attendance_records (attendance_event_id, volunteer_profile_id);

create index if not exists volunteer_attendance_records_department_idx
on public.volunteer_attendance_records (department_id, attendance_status);

create index if not exists volunteer_booth_attendance_records_record_idx
on public.volunteer_booth_attendance_records (attendance_record_id, recorded_at desc);

drop trigger if exists set_volunteer_attendance_events_updated_at on public.volunteer_department_attendance_events;
create trigger set_volunteer_attendance_events_updated_at
before update on public.volunteer_department_attendance_events
for each row execute function public.set_updated_at();

drop trigger if exists set_volunteer_attendance_records_updated_at on public.volunteer_attendance_records;
create trigger set_volunteer_attendance_records_updated_at
before update on public.volunteer_attendance_records
for each row execute function public.set_updated_at();

create or replace function public.can_view_volunteer_department(p_department_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select
    public.current_volunteer_profile_id() is not null
    and (
      public.can_manage_volunteers()
      or exists (
        select 1
        from public.volunteer_department_memberships membership
        where membership.volunteer_profile_id = public.current_volunteer_profile_id()
          and membership.department_id = p_department_id
          and membership.membership_status = 'approved'
      )
    );
$$;

create or replace function public.can_manage_volunteer_department_attendance(p_department_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select
    public.current_volunteer_profile_id() is not null
    and (
      public.can_manage_volunteers()
      or public.has_effective_permission('event.update', 'department', p_department_id)
      or exists (
        select 1
        from public.volunteer_department_memberships membership
        where membership.volunteer_profile_id = public.current_volunteer_profile_id()
          and membership.department_id = p_department_id
          and membership.membership_status = 'approved'
          and membership.department_role in ('department_head', 'deputy_head', 'coordinator')
      )
    );
$$;

create or replace function public.ensure_volunteer_department_member_serial(
  p_department_id uuid,
  p_volunteer_profile_id uuid,
  p_actor uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_serial integer;
begin
  select serial_number into v_serial
  from public.volunteer_department_member_serials
  where department_id = p_department_id
    and volunteer_profile_id = p_volunteer_profile_id;

  if v_serial is not null then
    return v_serial;
  end if;

  perform pg_advisory_xact_lock(hashtext('volunteer_department_member_serials:' || p_department_id::text));

  select serial_number into v_serial
  from public.volunteer_department_member_serials
  where department_id = p_department_id
    and volunteer_profile_id = p_volunteer_profile_id;

  if v_serial is not null then
    return v_serial;
  end if;

  select coalesce(max(serial_number), 0) + 1 into v_serial
  from public.volunteer_department_member_serials
  where department_id = p_department_id;

  insert into public.volunteer_department_member_serials (
    department_id,
    volunteer_profile_id,
    serial_number,
    assigned_by
  )
  values (p_department_id, p_volunteer_profile_id, v_serial, p_actor);

  return v_serial;
end;
$$;

create or replace function public.get_active_events(p_department_id uuid default null)
returns table(
  attendance_event_id uuid,
  department_id uuid,
  department_name text,
  event_id uuid,
  title text,
  event_date date,
  event_kind text,
  location text,
  status text,
  source text
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  return query
  select
    attendance_event.id,
    attendance_event.department_id,
    department.name,
    attendance_event.event_id,
    attendance_event.title,
    attendance_event.event_date,
    attendance_event.event_kind,
    attendance_event.location,
    attendance_event.status,
    'attendance_event'::text
  from public.volunteer_department_attendance_events attendance_event
  join public.club_departments department on department.id = attendance_event.department_id
  where attendance_event.archived_at is null
    and attendance_event.status <> 'archived'
    and (p_department_id is null or attendance_event.department_id = p_department_id)
    and public.can_view_volunteer_department(attendance_event.department_id)

  union all

  select
    null::uuid,
    assignment.department_id,
    department.name,
    event.id,
    event.title,
    event.event_date,
    'event'::text,
    event.location,
    assignment.assignment_status,
    'assigned_event'::text
  from public.event_department_assignments assignment
  join public.club_departments department on department.id = assignment.department_id
  join public.events event on event.id = assignment.event_id
  where assignment.assignment_status <> 'cancelled'
    and event.status <> 'archived'
    and (p_department_id is null or assignment.department_id = p_department_id)
    and public.can_view_volunteer_department(assignment.department_id)
    and not exists (
      select 1
      from public.volunteer_department_attendance_events existing
      where existing.department_id = assignment.department_id
        and existing.event_id = event.id
        and existing.archived_at is null
    )
  order by event_date desc, title asc;
end;
$$;

create or replace function public.create_volunteer_attendance_event(
  p_department_id uuid,
  p_title text,
  p_event_date date default current_date,
  p_event_kind text default 'meeting',
  p_location text default null,
  p_event_id uuid default null
)
returns table(attendance_event_id uuid)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_event public.volunteer_department_attendance_events%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.can_manage_volunteer_department_attendance(p_department_id) then
    raise exception 'Not authorized to create attendance events' using errcode = '42501';
  end if;

  if p_event_id is not null then
    select * into v_event
    from public.volunteer_department_attendance_events
    where department_id = p_department_id
      and event_id = p_event_id
      and archived_at is null
    limit 1;

    if found then
      return query select v_event.id;
      return;
    end if;
  end if;

  insert into public.volunteer_department_attendance_events (
    department_id,
    event_id,
    title,
    event_date,
    event_kind,
    location,
    created_by
  )
  values (
    p_department_id,
    p_event_id,
    btrim(p_title),
    coalesce(p_event_date, current_date),
    coalesce(nullif(p_event_kind, ''), 'meeting'),
    nullif(btrim(coalesce(p_location, '')), ''),
    v_actor
  )
  returning * into v_event;

  perform public.write_club_audit_log(
    'VOLUNTEER_ATTENDANCE_EVENT_CREATED',
    'volunteer_attendance_event',
    v_event.id,
    p_department_id,
    jsonb_build_object('title', v_event.title, 'event_id', p_event_id)
  );

  return query select v_event.id;
end;
$$;

create or replace function public.get_event_volunteers(p_attendance_event_id uuid)
returns table(
  attendance_record_id uuid,
  volunteer_profile_id uuid,
  serial_number integer,
  picture_url text,
  full_name text,
  student_id text,
  member_type text,
  attendance_status text,
  remarks text,
  booth_records jsonb
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_event public.volunteer_department_attendance_events%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into v_event
  from public.volunteer_department_attendance_events
  where id = p_attendance_event_id
    and archived_at is null;

  if not found then
    raise exception 'Attendance event not found' using errcode = 'P0002';
  end if;

  if not public.can_view_volunteer_department(v_event.department_id) then
    raise exception 'Not authorized to view attendance' using errcode = '42501';
  end if;

  return query
  with members as (
    select
      profile.id as profile_id,
      public.ensure_volunteer_department_member_serial(v_event.department_id, profile.id, v_actor) as serial_number,
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
  )
  select
    record.id,
    member.profile_id,
    member.serial_number,
    member.profile_photo_path,
    member.full_name,
    member.student_id,
    member.member_type,
    coalesce(record.attendance_status, 'unmarked'),
    record.remarks,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', booth.id,
            'location', booth.booth_location,
            'timeslot', booth.timeslot_label,
            'startsAt', booth.starts_at,
            'endsAt', booth.ends_at,
            'status', booth.attendance_status,
            'remarks', booth.remarks,
            'recordedAt', booth.recorded_at
          )
          order by booth.recorded_at desc
        )
        from public.volunteer_booth_attendance_records booth
        where booth.attendance_record_id = record.id
      ),
      '[]'::jsonb
    )
  from members member
  left join public.volunteer_attendance_records record
    on record.attendance_event_id = p_attendance_event_id
    and record.volunteer_profile_id = member.profile_id
  order by member.serial_number asc, member.full_name asc;
end;
$$;

create or replace function public.submit_attendance(
  p_attendance_event_id uuid,
  p_records jsonb
)
returns table(saved_count integer)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_event public.volunteer_department_attendance_events%rowtype;
  v_record jsonb;
  v_profile_id uuid;
  v_status text;
  v_remarks text;
  v_saved integer := 0;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into v_event
  from public.volunteer_department_attendance_events
  where id = p_attendance_event_id
    and archived_at is null
  for update;

  if not found then
    raise exception 'Attendance event not found' using errcode = 'P0002';
  end if;

  if not public.can_manage_volunteer_department_attendance(v_event.department_id) then
    raise exception 'Not authorized to save attendance' using errcode = '42501';
  end if;

  if jsonb_typeof(p_records) <> 'array' then
    raise exception 'Attendance records must be a JSON array' using errcode = '22023';
  end if;

  for v_record in select * from jsonb_array_elements(p_records)
  loop
    v_profile_id := nullif(v_record->>'volunteerProfileId', '')::uuid;
    v_status := coalesce(nullif(v_record->>'status', ''), 'unmarked');
    v_remarks := nullif(btrim(coalesce(v_record->>'remarks', '')), '');

    if v_status not in ('unmarked', 'present', 'absent') then
      raise exception 'Invalid attendance status' using errcode = '22023';
    end if;

    if not exists (
      select 1
      from public.volunteer_department_memberships membership
      where membership.department_id = v_event.department_id
        and membership.volunteer_profile_id = v_profile_id
        and membership.membership_status = 'approved'
    ) then
      raise exception 'Volunteer is not an approved member of this department' using errcode = '42501';
    end if;

    perform public.ensure_volunteer_department_member_serial(v_event.department_id, v_profile_id, v_actor);

    insert into public.volunteer_attendance_records (
      attendance_event_id,
      department_id,
      volunteer_profile_id,
      attendance_status,
      remarks,
      recorded_by,
      recorded_at
    )
    values (
      p_attendance_event_id,
      v_event.department_id,
      v_profile_id,
      v_status,
      v_remarks,
      v_actor,
      now()
    )
    on conflict (attendance_event_id, volunteer_profile_id)
    do update set
      attendance_status = excluded.attendance_status,
      remarks = excluded.remarks,
      recorded_by = excluded.recorded_by,
      recorded_at = excluded.recorded_at,
      updated_at = now();

    v_saved := v_saved + 1;
  end loop;

  perform public.write_club_audit_log(
    'VOLUNTEER_ATTENDANCE_SAVED',
    'volunteer_attendance_event',
    p_attendance_event_id,
    v_event.department_id,
    jsonb_build_object('saved_count', v_saved)
  );

  return query select v_saved;
end;
$$;

create or replace function public.get_volunteer_metrics(p_attendance_event_id uuid)
returns table(
  total_members bigint,
  present_count bigint,
  absent_count bigint,
  unmarked_count bigint,
  most_active_member text,
  most_irregular_member text
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_event public.volunteer_department_attendance_events%rowtype;
begin
  select * into v_event
  from public.volunteer_department_attendance_events
  where id = p_attendance_event_id
    and archived_at is null;

  if not found then
    raise exception 'Attendance event not found' using errcode = 'P0002';
  end if;

  if not public.can_view_volunteer_department(v_event.department_id) then
    raise exception 'Not authorized to view metrics' using errcode = '42501';
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
  current_records as (
    select record.attendance_status
    from public.volunteer_attendance_records record
    where record.attendance_event_id = p_attendance_event_id
  ),
  activity as (
    select
      profile.full_name,
      count(*) filter (where record.attendance_status = 'present') as present_total,
      count(*) filter (where record.attendance_status = 'absent') as absent_total
    from public.volunteer_attendance_records record
    join public.volunteer_profiles profile on profile.id = record.volunteer_profile_id
    where record.department_id = v_event.department_id
    group by profile.full_name
  )
  select
    (select count(*) from members)::bigint,
    (select count(*) from current_records where current_records.attendance_status = 'present')::bigint,
    (select count(*) from current_records where current_records.attendance_status = 'absent')::bigint,
    greatest(
      (select count(*) from members) - (select count(*) from current_records where current_records.attendance_status in ('present', 'absent')),
      0
    )::bigint,
    (select full_name from activity order by present_total desc, full_name asc limit 1),
    (select full_name from activity order by absent_total desc, full_name asc limit 1);
end;
$$;

create or replace function public.get_event_tasks(p_attendance_event_id uuid)
returns table(
  task_id uuid,
  task_name text,
  assigned_to text,
  status text,
  priority text,
  progress_percent integer,
  deadline timestamptz
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_event public.volunteer_department_attendance_events%rowtype;
begin
  select * into v_event
  from public.volunteer_department_attendance_events
  where id = p_attendance_event_id
    and archived_at is null;

  if not found then
    raise exception 'Attendance event not found' using errcode = 'P0002';
  end if;

  if not public.can_view_volunteer_department(v_event.department_id) then
    raise exception 'Not authorized to view tasks' using errcode = '42501';
  end if;

  return query
  select
    task.id,
    task.title,
    coalesce(string_agg(profile.full_name, ', ' order by profile.full_name), 'Unassigned'),
    task.task_status,
    task.priority,
    task.progress_percent,
    task.due_at
  from public.event_department_tasks task
  left join public.event_task_assignees assignee on assignee.task_id = task.id and assignee.assignment_status = 'active'
  left join public.volunteer_profiles profile on profile.id = assignee.volunteer_profile_id
  where task.department_id = v_event.department_id
    and (v_event.event_id is null or task.event_id = v_event.event_id)
  group by task.id, task.title, task.task_status, task.priority, task.progress_percent, task.due_at
  order by task.due_at asc nulls last, task.created_at desc;
end;
$$;

create or replace function public.get_committee_members(p_department_id uuid)
returns table(
  committee_id uuid,
  committee_name text,
  session_label text,
  committee_status text,
  member_name text,
  position_name text,
  member_status text,
  start_date date,
  end_date date
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if not public.can_view_volunteer_department(p_department_id) then
    raise exception 'Not authorized to view committee memberships' using errcode = '42501';
  end if;

  return query
  select
    committee.id,
    committee.name,
    committee.session_label,
    committee.status,
    profile.full_name,
    position.name,
    membership.status,
    membership.start_date,
    membership.end_date
  from public.committee_memberships membership
  join public.committees committee on committee.id = membership.committee_id
  join public.volunteer_profiles profile on profile.id = membership.volunteer_profile_id
  join public.club_positions position on position.id = membership.club_position_id
  where profile.primary_department_id = p_department_id
     or exists (
       select 1
       from public.volunteer_department_memberships department_membership
       where department_membership.department_id = p_department_id
         and department_membership.volunteer_profile_id = profile.id
         and department_membership.membership_status = 'approved'
     )
  order by committee.status = 'active' desc, committee.start_date desc, position.display_order asc, profile.full_name asc;
end;
$$;

create or replace function public.get_blood_assignments(p_department_id uuid)
returns table(
  assignment_id uuid,
  request_id uuid,
  action_label text,
  assignment_status text,
  assigned_to text,
  blood_group text,
  hospital_name text,
  needed_at timestamptz,
  due_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_can_manage boolean;
begin
  if not public.can_view_volunteer_department(p_department_id) then
    raise exception 'Not authorized to view blood assignments' using errcode = '42501';
  end if;

  v_can_manage := public.can_manage_blood_requests() or public.can_manage_blood_donors();

  return query
  select
    assignment.id,
    request.id,
    assignment.action_label,
    assignment.assignment_status,
    profile.full_name,
    request.blood_group,
    request.hospital_name,
    request.needed_at,
    assignment.due_at
  from public.blood_request_assignments assignment
  join public.blood_requests request on request.id = assignment.blood_request_id
  join public.volunteer_profiles profile on profile.id = assignment.volunteer_profile_id
  where assignment.assignment_status in ('active', 'completed')
    and (
      v_can_manage
      or assignment.volunteer_profile_id = v_actor
      or exists (
        select 1
        from public.volunteer_department_memberships membership
        where membership.department_id = p_department_id
          and membership.volunteer_profile_id = assignment.volunteer_profile_id
          and membership.membership_status = 'approved'
          and public.can_manage_volunteer_department_attendance(p_department_id)
      )
    )
  order by assignment.due_at asc nulls last, request.needed_at asc;
end;
$$;

alter table public.volunteer_department_attendance_events enable row level security;
alter table public.volunteer_department_member_serials enable row level security;
alter table public.volunteer_attendance_records enable row level security;
alter table public.volunteer_booth_attendance_records enable row level security;

revoke all on table public.volunteer_department_attendance_events from anon, authenticated;
revoke all on table public.volunteer_department_member_serials from anon, authenticated;
revoke all on table public.volunteer_attendance_records from anon, authenticated;
revoke all on table public.volunteer_booth_attendance_records from anon, authenticated;

grant select on table public.volunteer_department_attendance_events to authenticated;
grant select on table public.volunteer_department_member_serials to authenticated;
grant select on table public.volunteer_attendance_records to authenticated;
grant select on table public.volunteer_booth_attendance_records to authenticated;

drop policy if exists "Scoped users can read volunteer attendance events" on public.volunteer_department_attendance_events;
create policy "Scoped users can read volunteer attendance events"
on public.volunteer_department_attendance_events for select to authenticated
using (public.can_view_volunteer_department(department_id));

drop policy if exists "Scoped users can read volunteer serials" on public.volunteer_department_member_serials;
create policy "Scoped users can read volunteer serials"
on public.volunteer_department_member_serials for select to authenticated
using (public.can_view_volunteer_department(department_id));

drop policy if exists "Scoped users can read volunteer attendance records" on public.volunteer_attendance_records;
create policy "Scoped users can read volunteer attendance records"
on public.volunteer_attendance_records for select to authenticated
using (public.can_view_volunteer_department(department_id));

drop policy if exists "Scoped users can read booth attendance records" on public.volunteer_booth_attendance_records;
create policy "Scoped users can read booth attendance records"
on public.volunteer_booth_attendance_records for select to authenticated
using (
  exists (
    select 1
    from public.volunteer_attendance_records record
    where record.id = volunteer_booth_attendance_records.attendance_record_id
      and public.can_view_volunteer_department(record.department_id)
  )
);

revoke all on function public.can_view_volunteer_department(uuid) from anon, public;
revoke all on function public.can_manage_volunteer_department_attendance(uuid) from anon, public;
revoke all on function public.ensure_volunteer_department_member_serial(uuid, uuid, uuid) from anon, public;
revoke all on function public.get_active_events(uuid) from anon, public;
revoke all on function public.create_volunteer_attendance_event(uuid, text, date, text, text, uuid) from anon, public;
revoke all on function public.get_event_volunteers(uuid) from anon, public;
revoke all on function public.submit_attendance(uuid, jsonb) from anon, public;
revoke all on function public.get_volunteer_metrics(uuid) from anon, public;
revoke all on function public.get_event_tasks(uuid) from anon, public;
revoke all on function public.get_committee_members(uuid) from anon, public;
revoke all on function public.get_blood_assignments(uuid) from anon, public;

grant execute on function public.can_view_volunteer_department(uuid) to authenticated;
grant execute on function public.can_manage_volunteer_department_attendance(uuid) to authenticated;
grant execute on function public.get_active_events(uuid) to authenticated;
grant execute on function public.create_volunteer_attendance_event(uuid, text, date, text, text, uuid) to authenticated;
grant execute on function public.get_event_volunteers(uuid) to authenticated;
grant execute on function public.submit_attendance(uuid, jsonb) to authenticated;
grant execute on function public.get_volunteer_metrics(uuid) to authenticated;
grant execute on function public.get_event_tasks(uuid) to authenticated;
grant execute on function public.get_committee_members(uuid) to authenticated;
grant execute on function public.get_blood_assignments(uuid) to authenticated;
