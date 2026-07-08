-- Committee lifecycle completion can end a term held by the acting officer.
-- This is a committee-term action, not self-escalation, so it closes the linked
-- position assignment directly while preserving the same audit trail.

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
    update public.volunteer_club_positions
    set status = 'ended',
        is_primary = false,
        term_end = coalesce(p_end_date, current_date),
        ended_by = v_actor,
        ended_at = now(),
        reason = v_reason
    where id = v_membership.volunteer_club_position_id
      and status = 'active';

    perform public.write_club_audit_log(
      'POSITION_ENDED',
      'volunteer_profile',
      v_membership.volunteer_profile_id,
      null,
      jsonb_build_object(
        'assignment_id', v_membership.volunteer_club_position_id,
        'target_volunteer', v_membership.volunteer_profile_id,
        'old_position', v_membership.club_position_id,
        'reason', v_reason,
        'source', 'committee_lifecycle'
      )
    );
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

revoke all on function public.end_committee_member(uuid, date, text) from anon, public;
grant execute on function public.end_committee_member(uuid, date, text) to authenticated;
