-- Verification checks for the official UIUSSC role permission matrix.
-- Read-only assertions intended for the linked development Supabase project.

do $$
declare
  v_permission_count integer;
  v_position_policy_count integer;
  v_department_policy_count integer;
  v_scope_function_count integer;
begin
  select count(*) into v_permission_count
  from public.system_permissions
  where permission_key in (
    'event.view',
    'event.create',
    'event.update',
    'event.assign_lead',
    'event.assign_department',
    'event.delete',
    'task.view',
    'task.create',
    'task.assign',
    'task.update',
    'task.review',
    'task.complete',
    'user.view',
    'user.approve',
    'user.suspend',
    'user.manage_roles',
    'department.view',
    'department.manage_members',
    'department.manage_tasks',
    'content.create',
    'content.update',
    'content.publish',
    'committee.view',
    'committee.create',
    'committee.manage_positions',
    'blood.view',
    'blood.manage_requests',
    'blood.manage_donors',
    'blood.verify_donation',
    'finance.budget_manage',
    'finance.expense_view',
    'finance.request_approve'
  )
  and is_active = true;

  if v_permission_count <> 32 then
    raise exception 'Expected 32 active official permissions, found %', v_permission_count;
  end if;

  select count(*) into v_position_policy_count
  from public.club_position_permission_policies cppp
  join public.system_permissions sp on sp.id = cppp.permission_id
  where cppp.is_active = true
    and cppp.club_position_slug in ('president', 'vice-president', 'assistant-vice-president', 'general-secretary', 'treasurer')
    and sp.permission_key in ('event.view', 'task.view', 'department.view', 'committee.view', 'finance.expense_view');

  if v_position_policy_count < 10 then
    raise exception 'Official core position policies were not seeded correctly. Found % matching policies.', v_position_policy_count;
  end if;

  select count(*) into v_department_policy_count
  from public.department_role_permission_policies drpp
  join public.system_permissions sp on sp.id = drpp.permission_id
  where drpp.is_active = true
    and drpp.department_role in ('department_head', 'deputy_head', 'executive')
    and drpp.scope_rule in ('own_department', 'assigned_event', 'own_record')
    and sp.permission_key in ('department.view', 'department.manage_tasks', 'task.update', 'event.view');

  if v_department_policy_count < 6 then
    raise exception 'Department role scoped policies were not seeded correctly. Found % matching policies.', v_department_policy_count;
  end if;

  select count(*) into v_scope_function_count
  from pg_proc procedure
  join pg_namespace namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public'
    and procedure.proname = 'permission_scope_matches'
    and procedure.pronargs = 5;

  if v_scope_function_count <> 1 then
    raise exception 'permission_scope_matches(text,text,uuid,uuid,uuid) is missing.';
  end if;
end;
$$;

select
  'official_role_permission_matrix_verified' as result,
  now() as verified_at;
