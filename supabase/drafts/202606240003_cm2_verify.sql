select 'linked_project_expected_tuuwvcujoarfqhwiaeno' as check_name;

select
  c.relname as table_name,
  c.relrowsecurity as row_security
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'club_departments',
    'volunteer_profiles',
    'volunteer_department_memberships',
    'volunteer_platform_roles',
    'volunteer_status_history',
    'department_membership_history',
    'club_audit_logs'
  )
order by table_name;

select
  proname,
  prosecdef as security_definer
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname = 'submit_volunteer_onboarding';

select
  policyname,
  tablename,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('volunteer_platform_roles', 'volunteer_profiles', 'volunteer_department_memberships')
order by tablename, policyname;

select count(*) as blood_table_count
from information_schema.tables
where table_schema = 'public'
  and table_name like 'blood_%';

select count(*) as active_super_admin_count
from public.volunteer_platform_roles
where role = 'super_admin'
  and status = 'active';
