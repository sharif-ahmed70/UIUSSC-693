-- CM-4.1 role permission acceptance verification.
-- Read-only assertions for the linked development Supabase project.

do $$
declare
  v_count integer;
  v_definition text;
begin
  select count(*) into v_count
  from public.system_permissions
  where permission_key in (
    'event.view', 'event.create', 'event.update', 'event.assign_lead', 'event.assign_department',
    'task.view', 'task.create', 'task.assign', 'task.update', 'task.review', 'task.complete',
    'user.view', 'user.approve', 'user.suspend', 'user.manage_roles',
    'department.view', 'department.manage_members', 'department.manage_tasks',
    'content.create', 'content.update', 'content.publish',
    'committee.view', 'committee.manage_positions',
    'blood.view', 'blood.manage_requests', 'blood.manage_donors', 'blood.manage_matches', 'blood.assign_executives', 'blood.verify_donation',
    'finance.budget_manage', 'finance.expense_view', 'finance.request_approve'
  )
  and is_active = true;

  if v_count <> 32 then
    raise exception 'Expected 32 active official permission records, found %', v_count;
  end if;

  select count(*) into v_count
  from public.club_position_permission_policies policy
  join public.system_permissions permission on permission.id = policy.permission_id
  where policy.is_active = true
    and policy.club_position_slug = 'president'
    and policy.scope_rule = 'global'
    and permission.permission_key in (
      'event.create', 'event.update', 'event.assign_department',
      'task.assign', 'task.review',
      'user.approve',
      'department.manage_members',
      'committee.manage_positions',
      'content.publish'
    );

  if v_count <> 9 then
    raise exception 'President official-position matrix is incomplete. Found % expected policies.', v_count;
  end if;

  select count(*) into v_count
  from public.club_position_permission_policies policy
  join public.system_permissions permission on permission.id = policy.permission_id
  where policy.is_active = true
    and policy.club_position_slug in ('vice-president', 'assistant-vice-president', 'general-secretary', 'treasurer')
    and permission.permission_key = 'user.manage_roles';

  if v_count <> 0 then
    raise exception 'Core panel positions must not directly receive advanced website role management. Found % rows.', v_count;
  end if;

  select count(*) into v_count
  from public.platform_role_permission_policies policy
  join public.system_permissions permission on permission.id = policy.permission_id
  where policy.is_active = true
    and policy.platform_role <> 'super_admin'
    and permission.permission_key in ('user.manage_roles', 'platform_roles.assign', 'platform_roles.revoke');

  if v_count <> 0 then
    raise exception 'Non-Super website roles still contain advanced role-management policies. Found % rows.', v_count;
  end if;

  select count(*) into v_count
  from public.department_role_permission_policies policy
  join public.system_permissions permission on permission.id = policy.permission_id
  where policy.is_active = true
    and policy.department_role = 'department_head'
    and policy.scope_rule = 'own_department'
    and permission.permission_key in (
      'department.manage_members',
      'department.manage_tasks',
      'task.assign',
      'task.review',
      'blood.manage_requests',
      'blood.manage_donors',
      'blood.manage_matches',
      'blood.assign_executives',
      'blood.verify_donation'
    );

  if v_count <> 9 then
    raise exception 'Department Head own-department matrix is incomplete. Found % expected policies.', v_count;
  end if;

  select count(*) into v_count
  from public.department_role_permission_policies policy
  join public.system_permissions permission on permission.id = policy.permission_id
  where policy.is_active = true
    and policy.department_role = 'executive'
    and permission.permission_key in ('user.manage_roles', 'department.manage_members', 'blood.manage_requests', 'blood.assign_executives');

  if v_count <> 0 then
    raise exception 'Executive role has management access it should not have. Found % rows.', v_count;
  end if;

  select count(*) into v_count
  from public.department_role_permission_policies policy
  join public.system_permissions permission on permission.id = policy.permission_id
  where policy.is_active = true
    and policy.department_role = 'executive'
    and policy.scope_rule in ('assigned_event', 'own_record', 'assigned_record')
    and permission.permission_key in ('event.view', 'task.view', 'task.update', 'blood.view');

  if v_count < 4 then
    raise exception 'Executive scoped view/update matrix is incomplete. Found % matching rows.', v_count;
  end if;

  select count(*) into v_count
  from public.club_position_permission_policies policy
  join public.system_permissions permission on permission.id = policy.permission_id
  where policy.is_active = true
    and policy.club_position_slug = 'head-blood'
    and policy.scope_rule = 'own_department'
    and permission.permission_key like 'blood.%';

  if v_count <> 0 then
    raise exception 'Head of Blood still has misleading standalone position Blood policies. Found % rows.', v_count;
  end if;

  select pg_get_functiondef('public.permission_scope_matches(text,text,uuid,uuid,uuid)'::regprocedure) into v_definition;

  if v_definition not like '%assigned_record%' or v_definition not like '%blood_request_assignments%' then
    raise exception 'permission_scope_matches must support assigned Blood request records.';
  end if;

  select pg_get_functiondef('public.can_manage_blood_requests()'::regprocedure) into v_definition;

  if v_definition not like '%blood_department_id()%' then
    raise exception 'Blood request management must be limited through the Blood Department boundary.';
  end if;

  select pg_get_functiondef('public.revoke_platform_role(uuid,text)'::regprocedure) into v_definition;

  if v_definition not like '%v_active_super_admin_count <= 1%' then
    raise exception 'Final Super Admin revocation protection is missing.';
  end if;

  if has_function_privilege('anon', 'public.has_effective_permission(text,text,uuid)', 'EXECUTE') then
    raise exception 'Anon must not execute has_effective_permission.';
  end if;

  if has_function_privilege('anon', 'public.get_action_authorization(text,text,uuid)', 'EXECUTE') then
    raise exception 'Anon must not execute get_action_authorization.';
  end if;

  select count(*) into v_count
  from (
    values
      ('volunteer_profiles'),
      ('volunteer_platform_roles'),
      ('user_permission_overrides'),
      ('approval_requests'),
      ('club_event_operations'),
      ('event_department_tasks'),
      ('event_task_assignees'),
      ('blood_donor_contacts'),
      ('blood_request_contacts'),
      ('blood_request_assignments'),
      ('club_audit_logs')
  ) as private_tables(table_name)
  where has_table_privilege('anon', format('public.%I', private_tables.table_name), 'SELECT');

  if v_count <> 0 then
    raise exception 'Anon has SELECT on one or more internal tables. Count: %', v_count;
  end if;

  select count(*) into v_count
  from (
    values ('events'), ('notices'), ('gallery_items')
  ) as public_tables(table_name)
  where not has_table_privilege('anon', format('public.%I', public_tables.table_name), 'SELECT');

  if v_count <> 0 then
    raise exception 'Anon public-read grants are missing for published public content tables. Count: %', v_count;
  end if;
end;
$$;

select 'cm41_role_permission_acceptance_verified' as result, now() as verified_at;
