-- UIUSSC BB-1 follow-up: fix fulfilment recalculation column ambiguity
-- Version: 202606240009

create or replace function public.recalculate_blood_request_fulfilment(p_request_id uuid)
returns table(blood_request_id uuid, units_fulfilled integer, request_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_request public.blood_requests%rowtype;
  v_units integer;
  v_status text;
begin
  if v_actor is null or not (public.can_verify_blood_donations() or public.can_manage_blood_matches()) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into v_request from public.blood_requests where id = p_request_id for update;

  if not found then
    raise exception 'Blood request not found' using errcode = 'P0002';
  end if;

  select coalesce(sum(bd.verified_units), 0)::integer
  into v_units
  from public.blood_donations bd
  where bd.blood_request_id = p_request_id
    and bd.donation_status = 'verified';

  if v_request.request_status in ('rejected', 'cancelled', 'archived') then
    update public.blood_requests set units_fulfilled = v_units where id = p_request_id;
    return query select p_request_id, v_units, v_request.request_status;
    return;
  end if;

  v_status := case
    when v_units >= v_request.units_requested then 'fulfilled'
    when v_units > 0 then 'partially_fulfilled'
    else v_request.request_status
  end;

  update public.blood_requests
  set units_fulfilled = v_units,
      request_status = v_status
  where id = p_request_id;

  if v_status <> v_request.request_status then
    insert into public.blood_request_status_history (blood_request_id, previous_status, new_status, changed_by, reason, metadata)
    values (p_request_id, v_request.request_status, v_status, v_actor, 'verified donation fulfilment recalculation', jsonb_build_object('verified_units', v_units));
  end if;

  return query select p_request_id, v_units, v_status;
end;
$$;

revoke all on function public.recalculate_blood_request_fulfilment(uuid) from public;
grant execute on function public.recalculate_blood_request_fulfilment(uuid) to authenticated;
