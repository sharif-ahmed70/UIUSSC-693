-- Align club position revocation audit logging with lifecycle action names.

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
    raise exception 'Self position revocation is not allowed' using errcode = '42501';
  end if;

  update public.volunteer_club_positions
  set status = 'revoked',
      is_primary = false,
      revoked_by = v_actor,
      revoked_at = now(),
      reason = v_reason
  where id = p_assignment_id;

  perform public.write_club_audit_log(
    'POSITION_REVOKED',
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

  return query select p_assignment_id, 'revoked'::text;
end;
$$;

revoke all on function public.revoke_volunteer_club_position(uuid, text) from public;
grant execute on function public.revoke_volunteer_club_position(uuid, text) to authenticated;
