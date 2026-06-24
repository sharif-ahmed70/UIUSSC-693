-- CM-4: Staff invitation intent and department role support.

create table if not exists public.staff_invitations (
  id uuid primary key default extensions.gen_random_uuid(),
  invited_email text not null,
  normalized_email text not null,
  invited_name text,
  invitation_status text not null default 'draft',
  intended_club_position_id uuid references public.club_positions(id) on delete set null,
  intended_platform_role text,
  invited_by uuid not null references public.volunteer_profiles(id) on delete restrict,
  expires_at timestamptz not null,
  accepted_auth_user_id uuid,
  accepted_at timestamptz,
  cancelled_by uuid references public.volunteer_profiles(id) on delete set null,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_invitations_status_check check (invitation_status in ('draft', 'ready', 'sent', 'accepted', 'expired', 'cancelled', 'failed', 'operator_assisted')),
  constraint staff_invitations_platform_role_check check (intended_platform_role is null or intended_platform_role in ('club_admin', 'membership_admin', 'content_admin', 'department_admin')),
  constraint staff_invitations_email_check check (position('@' in normalized_email) > 1),
  constraint staff_invitations_no_token_columns_check check (invited_email !~* 'token|password')
);

create table if not exists public.staff_invitation_department_scopes (
  id uuid primary key default extensions.gen_random_uuid(),
  staff_invitation_id uuid not null references public.staff_invitations(id) on delete restrict,
  department_id uuid not null references public.club_departments(id) on delete restrict,
  intended_department_role text not null,
  created_at timestamptz not null default now(),
  constraint staff_invitation_department_role_check check (intended_department_role in ('department_head', 'deputy_head', 'executive'))
);

create unique index if not exists staff_invitations_one_active_email_idx
on public.staff_invitations (normalized_email)
where invitation_status in ('draft', 'ready', 'sent', 'operator_assisted');

create index if not exists staff_invitations_status_idx on public.staff_invitations (invitation_status, created_at desc);
create index if not exists staff_invitation_department_scopes_invitation_idx on public.staff_invitation_department_scopes (staff_invitation_id);
create unique index if not exists staff_invitation_department_scopes_unique_idx on public.staff_invitation_department_scopes (staff_invitation_id, department_id);

drop trigger if exists set_staff_invitations_updated_at on public.staff_invitations;
create trigger set_staff_invitations_updated_at
before update on public.staff_invitations
for each row execute function public.set_updated_at();

create or replace function public.create_staff_invitation(
  p_invited_email text,
  p_invited_name text,
  p_intended_club_position_id uuid,
  p_intended_platform_role text,
  p_expires_at timestamptz,
  p_department_scopes jsonb,
  p_reason text
)
returns table(staff_invitation_id uuid, invitation_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_invitation public.staff_invitations%rowtype;
  v_scope jsonb;
  v_role text;
begin
  if v_actor is null or not public.has_effective_permission('staff_invitations.create', 'global', null) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if p_intended_platform_role = 'super_admin' then
    raise exception 'Super Admin invitations are not supported here' using errcode = '42501';
  end if;

  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  insert into public.staff_invitations (
    invited_email,
    normalized_email,
    invited_name,
    invitation_status,
    intended_club_position_id,
    intended_platform_role,
    invited_by,
    expires_at
  )
  values (
    btrim(p_invited_email),
    lower(btrim(p_invited_email)),
    nullif(btrim(coalesce(p_invited_name, '')), ''),
    'operator_assisted',
    p_intended_club_position_id,
    nullif(btrim(coalesce(p_intended_platform_role, '')), ''),
    v_actor,
    coalesce(p_expires_at, now() + interval '14 days')
  )
  returning * into v_invitation;

  if p_department_scopes is not null and jsonb_typeof(p_department_scopes) = 'array' then
    for v_scope in select * from jsonb_array_elements(p_department_scopes)
    loop
      v_role := v_scope ->> 'department_role';
      if v_role not in ('department_head', 'deputy_head', 'executive') then
        raise exception 'Invalid department role' using errcode = '22023';
      end if;

      insert into public.staff_invitation_department_scopes (
        staff_invitation_id,
        department_id,
        intended_department_role
      )
      values (
        v_invitation.id,
        (v_scope ->> 'department_id')::uuid,
        v_role
      );
    end loop;
  end if;

  perform public.write_club_audit_log('staff_invitation.create_operator_assisted', 'staff_invitation', v_invitation.id, null, jsonb_build_object('delivery', 'operator_assisted'));

  return query select v_invitation.id, v_invitation.invitation_status;
end;
$$;

create or replace function public.cancel_staff_invitation(p_invitation_id uuid, p_reason text)
returns table(staff_invitation_id uuid, invitation_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_invitation public.staff_invitations%rowtype;
begin
  if v_actor is null or not public.has_effective_permission('staff_invitations.cancel', 'global', null) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if nullif(btrim(coalesce(p_reason, '')), '') is null then
    raise exception 'Reason is required' using errcode = '22023';
  end if;

  select * into v_invitation from public.staff_invitations where id = p_invitation_id for update;
  if not found then
    raise exception 'Invitation not found' using errcode = '02000';
  end if;

  if v_invitation.invitation_status in ('accepted', 'cancelled', 'expired') then
    return query select v_invitation.id, v_invitation.invitation_status;
    return;
  end if;

  update public.staff_invitations
  set invitation_status = 'cancelled',
      cancelled_by = v_actor,
      cancelled_at = now(),
      cancellation_reason = btrim(p_reason)
  where id = p_invitation_id
  returning * into v_invitation;

  perform public.write_club_audit_log('staff_invitation.cancel', 'staff_invitation', v_invitation.id, null, jsonb_build_object('status', 'cancelled'));

  return query select v_invitation.id, v_invitation.invitation_status;
end;
$$;

create or replace function public.mark_staff_invitation_accepted(
  p_invitation_id uuid,
  p_auth_user_id uuid
)
returns table(staff_invitation_id uuid, invitation_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_invitation public.staff_invitations%rowtype;
begin
  if v_actor is null or not public.has_effective_permission('staff_invitations.review', 'global', null) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into v_invitation from public.staff_invitations where id = p_invitation_id for update;
  if not found or v_invitation.invitation_status in ('cancelled', 'expired') then
    raise exception 'Invitation is not eligible for acceptance' using errcode = '22023';
  end if;

  update public.staff_invitations
  set invitation_status = 'accepted',
      accepted_auth_user_id = p_auth_user_id,
      accepted_at = now()
  where id = p_invitation_id
  returning * into v_invitation;

  perform public.write_club_audit_log('staff_invitation.accepted_marker', 'staff_invitation', v_invitation.id, null, jsonb_build_object('operator_assisted', true));

  return query select v_invitation.id, v_invitation.invitation_status;
end;
$$;

alter table public.staff_invitations enable row level security;
alter table public.staff_invitation_department_scopes enable row level security;

revoke all on table public.staff_invitations from anon, authenticated;
revoke all on table public.staff_invitation_department_scopes from anon, authenticated;

grant select on table public.staff_invitations to authenticated;
grant select on table public.staff_invitation_department_scopes to authenticated;

drop policy if exists "Authorized admins can read staff invitations" on public.staff_invitations;
create policy "Authorized admins can read staff invitations" on public.staff_invitations
for select to authenticated
using (public.has_effective_permission('staff_invitations.view', 'global', null));

drop policy if exists "Authorized admins can read staff invitation scopes" on public.staff_invitation_department_scopes;
create policy "Authorized admins can read staff invitation scopes" on public.staff_invitation_department_scopes
for select to authenticated
using (public.has_effective_permission('staff_invitations.view', 'global', null));

revoke all on function public.create_staff_invitation(text, text, uuid, text, timestamptz, jsonb, text) from public;
revoke all on function public.cancel_staff_invitation(uuid, text) from public;
revoke all on function public.mark_staff_invitation_accepted(uuid, uuid) from public;

grant execute on function public.create_staff_invitation(text, text, uuid, text, timestamptz, jsonb, text) to authenticated;
grant execute on function public.cancel_staff_invitation(uuid, text) to authenticated;
grant execute on function public.mark_staff_invitation_accepted(uuid, uuid) to authenticated;

select public.write_club_audit_log('access_governance.staff_invitation_foundation_ready', 'staff_invitation', null, null, jsonb_build_object('delivery', 'operator_assisted'));
