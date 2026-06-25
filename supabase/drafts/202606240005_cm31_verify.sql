select 'cm31_read_only_verification' as check_name;

select
  (select count(*) from auth.users where deleted_at is null) as auth_users,
  (select count(*) from public.volunteer_profiles) as volunteer_profiles,
  (select count(*) from public.volunteer_profiles where account_status = 'approved' and onboarding_status = 'approved') as approved_profiles,
  (select count(*) from public.volunteer_platform_roles where role = 'super_admin' and status = 'active') as active_super_admins,
  (select count(*) from information_schema.tables where table_schema = 'public' and table_name like 'blood_%') as blood_tables;

select onboarding_status, count(*) as profile_count
from public.volunteer_profiles
group by onboarding_status
order by onboarding_status;

select account_status, count(*) as profile_count
from public.volunteer_profiles
group by account_status
order by account_status;

select role, status, count(*) as role_count
from public.volunteer_platform_roles
group by role, status
order by role, status;

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

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in (
    'membership_applications',
    'volunteer_profiles',
    'volunteer_department_memberships',
    'volunteer_platform_roles',
    'club_audit_logs'
  )
  and privilege_type in ('UPDATE', 'DELETE')
order by table_name, grantee, privilege_type;

select
  (select count(*) from public.events) as events_count,
  (select count(*) from public.notices) as notices_count,
  (select count(*) from public.gallery_items) as gallery_items_count,
  (select count(*) from public.membership_applications) as membership_applications_count,
  (select count(*) from public.contact_messages) as contact_messages_count,
  (select count(*) from public.event_registrations) as event_registrations_count;
