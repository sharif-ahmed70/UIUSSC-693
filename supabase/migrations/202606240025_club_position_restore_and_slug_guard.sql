-- Harden club position slug management.
-- Slugs remain globally unique across active, inactive, and archived records.
-- Archived positions should be restored instead of recreated with duplicate slugs.

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
  v_existing public.club_positions%rowtype;
  v_slug text := lower(regexp_replace(btrim(p_slug), '[^a-zA-Z0-9]+', '-', 'g'));
begin
  if v_actor is null or not public.has_any_active_platform_role(array['super_admin', 'club_admin']) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  v_slug := regexp_replace(v_slug, '(^-|-$)', '', 'g');

  if nullif(btrim(coalesce(p_name, '')), '') is null or nullif(v_slug, '') is null then
    raise exception 'Position name and slug are required' using errcode = '22023';
  end if;

  select *
  into v_existing
  from public.club_positions
  where slug = v_slug
  for update;

  if found then
    if v_existing.status = 'archived' or v_existing.archived_at is not null then
      raise exception 'An archived position with this slug already exists. Restore it instead of creating a duplicate.' using errcode = '23505';
    end if;

    raise exception 'A position with this slug already exists.' using errcode = '23505';
  end if;

  insert into public.club_positions (name, slug, description, is_core_panel, display_order, status)
  values (btrim(p_name), v_slug, nullif(btrim(coalesce(p_description, '')), ''), coalesce(p_is_core_panel, false), greatest(coalesce(p_display_order, 0), 0), 'active')
  returning * into v_position;

  perform public.write_club_audit_log('club_position.create', 'club_position', v_position.id, null, jsonb_build_object('slug', v_position.slug, 'is_core_panel', v_position.is_core_panel));

  return query select v_position.id, v_position.slug;
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

  perform public.write_club_audit_log('club_position.restore', 'club_position', p_position_id, null, jsonb_build_object('previous_status', v_position.status, 'slug', v_position.slug, 'reason', btrim(p_reason)));

  return query select p_position_id, 'active'::text;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.club_positions'::regclass
      and conname = 'club_positions_slug_unique'
  ) then
    alter table public.club_positions
      add constraint club_positions_slug_unique unique (slug);
  end if;
end;
$$;

revoke all on function public.restore_club_position(uuid, text) from public;
grant execute on function public.restore_club_position(uuid, text) to authenticated;
