-- UIUSSC draft verification SQL.
-- Run only after reviewed migration is applied in a non-production environment.

-- Required tables.
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
    'platform_role_history',
    'club_audit_logs',
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
    'platform_role_history',
    'club_audit_logs',
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
order by relname;

-- Policies.
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('blood_donors', 'blood_requests')
order by tablename, policyname;

-- Grants.
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('blood_donors', 'blood_requests')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- Column grants for public submissions.
select table_name, column_name, grantee, privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name in ('blood_donors', 'blood_requests')
  and grantee in ('anon', 'authenticated')
order by table_name, column_name, grantee, privilege_type;

-- Broad public privileges should return zero rows.
select table_schema, table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in (
    'club_departments',
    'volunteer_profiles',
    'volunteer_department_memberships',
    'volunteer_platform_roles',
    'club_audit_logs',
    'blood_donors',
    'blood_requests',
    'blood_donor_assignments',
    'blood_contact_attempts',
    'blood_donation_history'
  )
  and privilege_type in ('SELECT', 'UPDATE', 'DELETE');

-- Indexes.
select tablename, indexname
from pg_indexes
where schemaname = 'public'
  and tablename like 'blood_%'
order by tablename, indexname;

-- Triggers.
select event_object_table, trigger_name
from information_schema.triggers
where trigger_schema = 'public'
  and trigger_name like 'set_%_updated_at'
order by event_object_table, trigger_name;

-- Constraints.
select conrelid::regclass as table_name, conname, contype
from pg_constraint
where connamespace = 'public'::regnamespace
  and conrelid::regclass::text in (
    'club_departments',
    'volunteer_profiles',
    'volunteer_department_memberships',
    'volunteer_platform_roles',
    'blood_donors',
    'blood_requests',
    'blood_donor_assignments',
    'blood_contact_attempts',
    'blood_donation_history',
    'notification_outbox'
  )
order by table_name, conname;

-- Foreign keys.
select
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
  and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
  and tc.table_name in (
    'volunteer_profiles',
    'volunteer_department_memberships',
    'volunteer_platform_roles',
    'blood_donors',
    'blood_requests',
    'blood_donor_assignments',
    'blood_contact_attempts',
    'blood_donation_history',
    'notification_outbox'
  )
order by tc.table_name, tc.constraint_name;

-- Functions and security mode.
select
  n.nspname as schema_name,
  p.proname as function_name,
  case when p.prosecdef then 'security definer' else 'security invoker' end as security_mode,
  p.provolatile
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('set_updated_at', 'generate_blood_request_reference')
order by p.proname;

-- Department and settings seed counts.
select count(*) as active_initial_departments
from public.club_departments
where slug in ('blood', 'event-management', 'volunteer-management', 'logistics', 'graphics-design', 'public-relations', 'human-resources');

select count(*) as blood_module_settings_count
from public.blood_module_settings
where setting_key in (
  'request_expiry_hours',
  'donor_contact_cooldown_hours',
  'maximum_donors_per_contact_batch',
  'proof_max_file_size_mb',
  'matching_weights',
  'donation_interval_policy_reference',
  'emergency_behavior'
);
