-- Committee Management lifecycle verification.

do $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from information_schema.tables
  where table_schema = 'public'
    and table_name in ('committees', 'committee_memberships');

  if v_count <> 2 then
    raise exception 'Committee tables are missing. Found %', v_count;
  end if;

  select count(*) into v_count
  from pg_indexes
  where schemaname = 'public'
    and indexname in (
      'committees_one_active_idx',
      'committee_memberships_one_active_primary_position_idx',
      'committee_memberships_one_active_profile_position_idx'
    );

  if v_count <> 3 then
    raise exception 'Committee lifecycle unique indexes are missing. Found %', v_count;
  end if;

  select count(*) into v_count
  from pg_proc procedure
  join pg_namespace namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public'
    and procedure.proname in (
      'can_view_committees',
      'can_manage_committees',
      'create_committee',
      'assign_committee_member',
      'activate_committee',
      'end_committee_member',
      'complete_committee',
      'archive_committee',
      'get_active_committee_public'
    );

  if v_count <> 9 then
    raise exception 'Committee management RPCs are missing. Found %', v_count;
  end if;

  if has_function_privilege('anon', 'public.create_committee(text,text,date,date)', 'EXECUTE') then
    raise exception 'Anon must not create committees.';
  end if;

  if has_function_privilege('anon', 'public.assign_committee_member(uuid,uuid,uuid,date,text)', 'EXECUTE') then
    raise exception 'Anon must not assign committee members.';
  end if;

  if not has_function_privilege('anon', 'public.get_active_committee_public()', 'EXECUTE') then
    raise exception 'Anon should be able to read the public active committee summary.';
  end if;

  if not has_table_privilege('anon', 'public.committees', 'SELECT') then
    raise exception 'Anon should be able to read active public committee rows through RLS.';
  end if;

  if has_table_privilege('anon', 'public.committees', 'INSERT')
    or has_table_privilege('anon', 'public.committee_memberships', 'INSERT') then
    raise exception 'Anon must not write committee tables.';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'committees'
      and policyname = 'Public can read active committees'
  ) then
    raise exception 'Public active committee RLS policy is missing.';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'committee_memberships'
      and policyname = 'Committee admins can read committee memberships'
  ) then
    raise exception 'Committee admin membership RLS policy is missing.';
  end if;
end;
$$;

select 'committee_management_lifecycle_verified' as result, now() as verified_at;
