select 'bb1_verify' as check_name;

select count(*) as expected_blood_tables
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'blood_support_settings',
    'blood_donor_profiles',
    'blood_donor_contacts',
    'blood_requests',
    'blood_request_contacts',
    'blood_matches',
    'blood_donations',
    'blood_donor_status_history',
    'blood_request_status_history',
    'blood_match_status_history',
    'blood_donation_status_history',
    'blood_donor_duplicate_reviews'
  );

select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname like 'blood_%'
order by c.relname;

select proname, prosecdef as security_definer, proconfig
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'blood_department_id',
    'is_blood_department_member',
    'has_blood_department_role',
    'can_view_blood_operations',
    'can_manage_blood_donors',
    'can_manage_blood_requests',
    'can_manage_blood_matches',
    'can_verify_blood_donations',
    'can_manage_blood_settings',
    'review_blood_donor',
    'change_blood_donor_availability',
    'review_blood_request',
    'change_blood_request_status',
    'create_blood_match',
    'change_blood_match_status',
    'authorize_blood_match_contact',
    'get_authorized_blood_match_contacts',
    'record_blood_donation',
    'verify_blood_donation',
    'recalculate_blood_request_fulfilment',
    'archive_blood_donor',
    'archive_blood_request'
  )
order by proname;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name like 'blood_%'
  and grantee = 'anon'
order by table_name, privilege_type;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name like 'blood_%'
  and grantee = 'authenticated'
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
order by table_name, privilege_type;

select setting_key, setting_value, is_active
from public.blood_support_settings
where setting_key in ('public_request_intake_enabled', 'public_donor_interest_enabled', 'human_review_required', 'donation_verification_required')
order by setting_key;

select
  (select count(*) from public.blood_donor_profiles) as donor_count,
  (select count(*) from public.blood_requests) as request_count,
  (select count(*) from public.blood_matches) as match_count,
  (select count(*) from public.blood_donations) as donation_count,
  (select count(*) from storage.buckets where id like 'blood%') as blood_storage_bucket_count,
  (select count(*) from public.volunteer_platform_roles where role = 'super_admin' and status = 'active') as active_super_admin_count,
  (select count(*) from public.volunteer_club_positions vcp join public.club_positions cp on cp.id = vcp.club_position_id where cp.slug = 'general-secretary' and vcp.status = 'active' and vcp.is_primary = true) as active_primary_general_secretary_count,
  (select count(*) from public.events where status = 'published') as published_events,
  (select count(*) from public.notices where status = 'published') as published_notices,
  (select count(*) from public.gallery_items where status = 'published') as published_gallery_items;
