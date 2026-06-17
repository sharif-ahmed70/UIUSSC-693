-- UIUSSC Phase 2A verification queries
-- Read-only checks for manual review after running migration and seed.

-- Public tables created for UIUSSC
select
  table_schema,
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'events',
    'notices',
    'gallery_items',
    'membership_applications',
    'contact_messages',
    'event_registrations'
  )
order by table_name;

-- RLS enabled status
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'events',
    'notices',
    'gallery_items',
    'membership_applications',
    'contact_messages',
    'event_registrations'
  )
order by tablename;

-- Policies by table
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'events',
    'notices',
    'gallery_items',
    'membership_applications',
    'contact_messages',
    'event_registrations'
  )
order by tablename, policyname;

-- Table-level grants for public API roles
select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in (
    'events',
    'notices',
    'gallery_items',
    'membership_applications',
    'contact_messages',
    'event_registrations'
  )
order by table_name, grantee, privilege_type;

-- Column-level grants for public API roles
select
  table_schema,
  table_name,
  column_name,
  grantee,
  privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in (
    'membership_applications',
    'contact_messages',
    'event_registrations'
  )
order by table_name, column_name, grantee, privilege_type;

-- Indexes
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'events',
    'notices',
    'gallery_items',
    'membership_applications',
    'contact_messages',
    'event_registrations'
  )
order by tablename, indexname;

-- Normalized unique indexes for duplicate prevention
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'membership_applications_one_pending_student_id_idx',
    'event_registrations_one_email_per_event_idx',
    'event_registrations_one_student_id_per_event_idx'
  )
order by tablename, indexname;

-- Updated-at triggers
select
  event_object_schema,
  event_object_table,
  trigger_name,
  action_timing,
  event_manipulation
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in (
    'events',
    'notices',
    'gallery_items',
    'membership_applications',
    'contact_messages',
    'event_registrations'
  )
order by event_object_table, trigger_name;

-- Seed counts for public content tables
select 'events' as table_name, count(*) as row_count from public.events
union all
select 'notices' as table_name, count(*) as row_count from public.notices
union all
select 'gallery_items' as table_name, count(*) as row_count from public.gallery_items
order by table_name;
