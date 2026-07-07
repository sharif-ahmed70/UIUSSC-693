-- Club position lifecycle management.
-- Reuses volunteer_club_positions as the durable history table.

alter table public.volunteer_club_positions
  drop constraint if exists volunteer_club_positions_status_check;

alter table public.volunteer_club_positions
  add constraint volunteer_club_positions_status_check
  check (status in ('active', 'ended', 'completed', 'revoked', 'inactive'));

create unique index if not exists volunteer_club_positions_one_active_primary_position_idx
on public.volunteer_club_positions (club_position_id)
where status = 'active' and is_primary = true;

create or replace function public.enforce_club_position_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_is_core_panel boolean := false;
begin
  if new.status <> 'active' then
    return new;
  end if;

  select is_core_panel
  into v_is_core_panel
  from public.club_positions
  where id = new.club_position_id;

  if not coalesce(v_is_core_panel, false) then
    return new;
  end if;

  update public.volunteer_club_positions vcp
  set status = 'ended',
      is_primary = false,
      term_end = coalesce(new.term_start, current_date),
      ended_by = coalesce(new.assigned_by, public.current_volunteer_profile_id()),
      ended_at = now(),
      reason = coalesce(new.reason, 'Ended automatically before assigning a new core position')
  from public.club_positions cp
  where cp.id = vcp.club_position_id
    and cp.is_core_panel = true
    and vcp.volunteer_profile_id = new.volunteer_profile_id
    and vcp.status = 'active'
    and vcp.id is distinct from new.id;

  if coalesce(new.is_primary, false) and exists (
    select 1
    from public.volunteer_club_positions vcp
    where vcp.club_position_id = new.club_position_id
      and vcp.status = 'active'
      and vcp.is_primary = true
      and vcp.id is distinct from new.id
  ) then
    raise exception 'Core position already has an active primary holder' using errcode = '23505';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_club_position_lifecycle_trigger on public.volunteer_club_positions;
create trigger enforce_club_position_lifecycle_trigger
before insert or update on public.volunteer_club_positions
for each row execute function public.enforce_club_position_lifecycle();

create or replace function public.assign_club_position(
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
  v_new_position public.club_positions%rowtype;
  v_closed_count integer := 0;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if v_actor is null or not public.has_any_active_platform_role(array['super_admin', 'club_admin']) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if p_profile_id = v_actor then
    raise exception 'Self position assignment is not allowed' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.volunteer_profiles
    where id = p_profile_id
      and account_status = 'approved'
      and onboarding_status = 'approved'
      and archived_at is null
  ) then
    raise exception 'Target profile must be approved' using errcode = '22023';
  end if;

  select *
  into v_new_position
  from public.club_positions
  where id = p_position_id
    and status = 'active'
    and archived_at is null
  for update;

  if not found then
    raise exception 'Position must be active' using errcode = '22023';
  end if;

  if v_new_position.is_core_panel then
    update public.volunteer_club_positions vcp
    set status = 'ended',
        is_primary = false,
        term_end = coalesce(p_term_start, current_date),
        ended_by = v_actor,
        ended_at = now(),
        reason = coalesce(v_reason, 'Ended automatically before assigning a new core position')
    from public.club_positions cp
    where cp.id = vcp.club_position_id
      and cp.is_core_panel = true
      and vcp.volunteer_profile_id = p_profile_id
      and vcp.status = 'active'
      and vcp.club_position_id <> p_position_id;

    get diagnostics v_closed_count = row_count;
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
    v_reason
  )
  returning * into v_assignment;

  perform public.write_club_audit_log(
    'POSITION_ASSIGNED',
    'volunteer_profile',
    p_profile_id,
    null,
    jsonb_build_object(
      'assignment_id', v_assignment.id,
      'target_volunteer', p_profile_id,
      'new_position', p_position_id,
      'closed_previous_core_positions', v_closed_count,
      'reason', v_reason
    )
  );

  return query select v_assignment.id, v_assignment.status;
end;
$$;

create or replace function public.restore_club_position(p_position_id uuid, p_reason text)
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

  select *
  into v_position
  from public.club_positions
  where id = p_position_id
  for update;

  if not found then
    raise exception 'Position not found' using errcode = 'P0002';
  end if;

  if v_position.status <> 'archived' and v_position.archived_at is null then
    raise exception 'Only archived positions can be restored' using errcode = '22023';
  end if;

  update public.club_positions
  set status = 'active',
      archived_at = null
  where id = p_position_id;

  perform public.write_club_audit_log(
    'POSITION_RESTORED',
    'club_position',
    p_position_id,
    null,
    jsonb_build_object('old_position', p_position_id, 'new_position', p_position_id, 'reason', btrim(p_reason))
  );

  return query select p_position_id, 'active'::text;
end;
$$;

create or replace function public.end_club_position(
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
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if v_actor is null or not public.has_any_active_platform_role(array['super_admin', 'club_admin']) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if v_reason is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  select *
  into v_assignment
  from public.volunteer_club_positions
  where id = p_assignment_id
  for update;

  if not found then
    raise exception 'Position assignment not found' using errcode = 'P0002';
  end if;

  if v_assignment.volunteer_profile_id = v_actor then
    raise exception 'Self position ending is not allowed' using errcode = '42501';
  end if;

  if v_assignment.status <> 'active' then
    raise exception 'Only active assignments can be ended' using errcode = '22023';
  end if;

  update public.volunteer_club_positions
  set status = 'ended',
      is_primary = false,
      term_end = coalesce(p_term_end, current_date),
      ended_by = v_actor,
      ended_at = now(),
      reason = v_reason
  where id = p_assignment_id;

  perform public.write_club_audit_log(
    'POSITION_ENDED',
    'volunteer_profile',
    v_assignment.volunteer_profile_id,
    null,
    jsonb_build_object(
      'assignment_id', p_assignment_id,
      'target_volunteer', v_assignment.volunteer_profile_id,
      'old_position', v_assignment.club_position_id,
      'reason', v_reason
    )
  );

  return query select p_assignment_id, 'ended'::text;
end;
$$;

create or replace function public.transfer_club_position(
  p_current_assignment_id uuid,
  p_new_position_id uuid,
  p_term_start date default current_date,
  p_reason text default null
)
returns table(ended_assignment_id uuid, new_assignment_id uuid, status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_current public.volunteer_club_positions%rowtype;
  v_new_assignment_id uuid;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if v_actor is null or not public.has_any_active_platform_role(array['super_admin', 'club_admin']) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if v_reason is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  select *
  into v_current
  from public.volunteer_club_positions
  where id = p_current_assignment_id
  for update;

  if not found then
    raise exception 'Current position assignment not found' using errcode = 'P0002';
  end if;

  if v_current.status <> 'active' then
    raise exception 'Only active assignments can be transferred' using errcode = '22023';
  end if;

  perform public.end_club_position(p_current_assignment_id, coalesce(p_term_start, current_date), v_reason);

  select assigned.assignment_id
  into v_new_assignment_id
  from public.assign_club_position(v_current.volunteer_profile_id, p_new_position_id, true, coalesce(p_term_start, current_date), v_reason) assigned;

  perform public.write_club_audit_log(
    'POSITION_TRANSFERRED',
    'volunteer_profile',
    v_current.volunteer_profile_id,
    null,
    jsonb_build_object(
      'target_volunteer', v_current.volunteer_profile_id,
      'old_assignment_id', p_current_assignment_id,
      'new_assignment_id', v_new_assignment_id,
      'old_position', v_current.club_position_id,
      'new_position', p_new_position_id,
      'reason', v_reason
    )
  );

  return query select p_current_assignment_id, v_new_assignment_id, 'active'::text;
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
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select * from public.assign_club_position(p_profile_id, p_position_id, p_is_primary, p_term_start, p_reason);
$$;

create or replace function public.complete_volunteer_club_position(
  p_assignment_id uuid,
  p_term_end date default current_date,
  p_reason text default null
)
returns table(assignment_id uuid, status text)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select * from public.end_club_position(p_assignment_id, p_term_end, coalesce(p_reason, 'Term completed'));
$$;

revoke all on function public.assign_club_position(uuid, uuid, boolean, date, text) from public;
revoke all on function public.end_club_position(uuid, date, text) from public;
revoke all on function public.transfer_club_position(uuid, uuid, date, text) from public;
revoke all on function public.restore_club_position(uuid, text) from public;
grant execute on function public.assign_club_position(uuid, uuid, boolean, date, text) to authenticated;
grant execute on function public.end_club_position(uuid, date, text) to authenticated;
grant execute on function public.transfer_club_position(uuid, uuid, date, text) to authenticated;
grant execute on function public.restore_club_position(uuid, text) to authenticated;
