-- BB-2 read-only verification.

do $$
declare
  v_assignment_table integer;
  v_public_rpc_count integer;
  v_permission_count integer;
  v_policy_count integer;
begin
  select count(*) into v_assignment_table
  from information_schema.tables
  where table_schema = 'public'
    and table_name = 'blood_request_assignments';

  if v_assignment_table <> 1 then
    raise exception 'blood_request_assignments table is missing';
  end if;

  select count(*) into v_public_rpc_count
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('submit_public_blood_request', 'submit_public_blood_donor_interest');

  if v_public_rpc_count <> 2 then
    raise exception 'Expected 2 public BB-2 intake RPCs, found %', v_public_rpc_count;
  end if;

  select count(*) into v_permission_count
  from public.system_permissions
  where permission_key in ('blood.manage_matches', 'blood.assign_executives')
    and is_active = true;

  if v_permission_count <> 2 then
    raise exception 'Expected 2 BB-2 blood permissions, found %', v_permission_count;
  end if;

  select count(*) into v_policy_count
  from public.department_role_permission_policies drpp
  join public.system_permissions sp on sp.id = drpp.permission_id
  where drpp.is_active = true
    and sp.permission_key like 'blood.%'
    and drpp.department_role in ('department_head', 'deputy_head', 'executive');

  if v_policy_count < 6 then
    raise exception 'Expected scoped department blood policies, found %', v_policy_count;
  end if;
end;
$$;

select 'bb2_blood_operational_management_verified' as result, now() as verified_at;
