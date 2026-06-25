-- UIUSSC Phase CM-1 verification SQL.
-- Read-only. Run against the linked development database after migration.

-- Expected CM-1 tables.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'club_departments',
    'volunteer_profiles',
    'volunteer_department_memberships',
    'volunteer_platform_roles',
    'volunteer_status_history',
    'department_membership_history',
    'club_audit_logs'
  )
order by table_name;

-- Initial department seeds.
select slug, name, status, display_order
from public.club_departments
where slug in (
  'blood',
  'event-management',
  'volunteer-management',
  'logistics',
  'graphics-design',
  'public-relations',
  'human-resources'
)
order by display_order;

-- RLS enabled.
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in (
    'club_departments',
    'volunteer_profiles',
    'volunteer_department_memberships',
    'volunteer_platform_roles',
    'volunteer_status_history',
    'department_membership_history',
    'club_audit_logs'
  )
order by relname;

-- Policies.
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in (
    'club_departments',
    'volunteer_profiles',
    'volunteer_department_memberships',
    'volunteer_platform_roles',
    'volunteer_status_history',
    'department_membership_history',
    'club_audit_logs'
  )
order by tablename, policyname;

-- Table grants to anon/authenticated.
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'club_departments',
    'volunteer_profiles',
    'volunteer_department_memberships',
    'volunteer_platform_roles',
    'volunteer_status_history',
    'department_membership_history',
    'club_audit_logs'
  )
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- Column grants to anon/authenticated.
select table_name, column_name, grantee, privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name in (
    'club_departments',
    'volunteer_profiles',
    'volunteer_department_memberships',
    'volunteer_platform_roles',
    'volunteer_status_history',
    'department_membership_history',
    'club_audit_logs'
  )
  and grantee in ('anon', 'authenticated')
order by table_name, column_name, grantee, privilege_type;

-- Primary keys, unique constraints, foreign keys, and checks.
select conrelid::regclass as table_name, conname, contype
from pg_constraint
where connamespace = 'public'::regnamespace
  and conrelid::regclass::text in (
    'club_departments',
    'volunteer_profiles',
    'volunteer_department_memberships',
    'volunteer_platform_roles',
    'volunteer_status_history',
    'department_membership_history',
    'club_audit_logs'
  )
order by table_name, conname;

-- Indexes, including partial unique indexes.
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'club_departments',
    'volunteer_profiles',
    'volunteer_department_memberships',
    'volunteer_platform_roles',
    'volunteer_status_history',
    'department_membership_history',
    'club_audit_logs'
  )
order by tablename, indexname;

-- Updated-at triggers on mutable tables only.
select event_object_table, trigger_name
from information_schema.triggers
where trigger_schema = 'public'
  and event_object_table in (
    'club_departments',
    'volunteer_profiles',
    'volunteer_department_memberships',
    'volunteer_platform_roles'
  )
order by event_object_table, trigger_name;

-- No broad anon access beyond active department metadata.
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'anon'
  and table_name in (
    'volunteer_profiles',
    'volunteer_department_memberships',
    'volunteer_platform_roles',
    'volunteer_status_history',
    'department_membership_history',
    'club_audit_logs'
  );

-- No broad authenticated write access to privileged tables.
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'authenticated'
  and table_name in (
    'volunteer_platform_roles',
    'volunteer_status_history',
    'department_membership_history',
    'club_audit_logs'
  )
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE');

-- No Blood tables accidentally created in CM-1.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'blood_donors',
    'blood_requests',
    'blood_request_status_history',
    'blood_donor_assignments',
    'blood_assignment_status_history',
    'blood_contact_attempts',
    'blood_donation_history',
    'blood_module_settings',
    'notification_outbox'
  )
order by table_name;

-- No real super admin inserted.
select count(*) as active_super_admin_count
from public.volunteer_platform_roles
where role = 'super_admin'
  and status = 'active';

-- Existing app tables and public content counts.
select 'events' as table_name, count(*) as row_count from public.events
union all
select 'notices', count(*) from public.notices
union all
select 'gallery_items', count(*) from public.gallery_items
union all
select 'membership_applications', count(*) from public.membership_applications
union all
select 'contact_messages', count(*) from public.contact_messages
union all
select 'event_registrations', count(*) from public.event_registrations
order by table_name;
