-- Guided staff setup verification.
-- Development only. Transaction-wrapped metadata and behavior assertions.

begin;

do $$
declare
  v_public_execute boolean;
  v_anon_execute boolean;
  v_authenticated_execute boolean;
  v_has_safe_search_path boolean;
  v_function_definition text;
begin
  if to_regprocedure('public.setup_staff_access(uuid,text,uuid,text)') is null then
    raise exception 'setup_staff_access RPC is missing';
  end if;

  select 'search_path=public, auth, pg_temp' = any(coalesce(p.proconfig, array[]::text[]))
  into v_has_safe_search_path
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.oid = to_regprocedure('public.setup_staff_access(uuid,text,uuid,text)');

  if not coalesce(v_has_safe_search_path, false) then
    raise exception 'setup_staff_access search_path is not fixed safely';
  end if;

  select has_function_privilege('public', 'public.setup_staff_access(uuid,text,uuid,text)', 'execute')
  into v_public_execute;

  if v_public_execute then
    raise exception 'PUBLIC can execute setup_staff_access';
  end if;

  select has_function_privilege('anon', 'public.setup_staff_access(uuid,text,uuid,text)', 'execute')
  into v_anon_execute;

  if v_anon_execute then
    raise exception 'anon can execute setup_staff_access';
  end if;

  select has_function_privilege('authenticated', 'public.setup_staff_access(uuid,text,uuid,text)', 'execute')
  into v_authenticated_execute;

  if not v_authenticated_execute then
    raise exception 'authenticated cannot execute setup_staff_access';
  end if;

  select pg_get_functiondef(to_regprocedure('public.setup_staff_access(uuid,text,uuid,text)'))
  into v_function_definition;

  if v_function_definition !~ 'Super Admin cannot be assigned through guided staff setup'
    or v_function_definition !~ 'Self-escalation is not allowed'
    or v_function_definition !~ 'department_head'
    or v_function_definition !~ 'executive' then
    raise exception 'setup_staff_access safety/template checks are missing or expose Super Admin assignment';
  end if;
end $$;

select 'simple_staff_setup_metadata_assertions_passed' as check_name, true as ok;

rollback;
