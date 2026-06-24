select 'cm3_expected_project_tuuwvcujoarfqhwiaeno' as check_name;

select version
from supabase_migrations.schema_migrations
where version = '202606240004';

select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'membership_applications',
    'membership_application_status_history',
    'club_departments',
    'volunteer_profiles',
    'volunteer_department_memberships',
    'volunteer_platform_roles',
    'volunteer_status_history',
    'department_membership_history',
    'club_audit_logs'
  )
order by c.relname;

select proname, prosecdef as security_definer
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'current_volunteer_profile_id',
    'is_active_approved_volunteer',
    'has_active_platform_role',
    'has_any_active_platform_role',
    'has_active_department_role',
    'can_manage_volunteers',
    'can_manage_departments',
    'can_manage_platform_roles',
    'can_review_membership_applications',
    'can_view_audit_logs',
    'review_membership_application',
    'approve_volunteer_profile',
    'reject_volunteer_profile',
    'suspend_volunteer_profile',
    'restore_volunteer_profile',
    'approve_department_membership',
    'reject_department_membership',
    'suspend_department_membership',
    'remove_department_membership',
    'change_department_role',
    'set_primary_department',
    'assign_platform_role',
    'revoke_platform_role',
    'create_club_department',
    'update_club_department',
    'archive_club_department'
  )
order by proname;

select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'membership_applications',
    'membership_application_status_history',
    'club_departments',
    'volunteer_profiles',
    'volunteer_department_memberships',
    'volunteer_platform_roles',
    'volunteer_status_history',
    'department_membership_history',
    'club_audit_logs'
  )
order by tablename, policyname;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'membership_applications',
    'club_departments',
    'volunteer_profiles',
    'volunteer_department_memberships',
    'volunteer_platform_roles',
    'club_audit_logs'
  )
  and grantee in ('anon', 'authenticated')
  and privilege_type in ('UPDATE', 'DELETE')
order by table_name, grantee, privilege_type;

select count(*) as blood_table_count
from information_schema.tables
where table_schema = 'public'
  and table_name like 'blood_%';

select count(*) as active_super_admin_count
from public.volunteer_platform_roles
where role = 'super_admin'
  and status = 'active';

select
  (select count(*) from public.events) as events_count,
  (select count(*) from public.notices) as notices_count,
  (select count(*) from public.gallery_items) as gallery_items_count,
  (select count(*) from public.membership_applications) as membership_applications_count,
  (select count(*) from public.contact_messages) as contact_messages_count,
  (select count(*) from public.event_registrations) as event_registrations_count;
