select 'leadership_core_panel_verification' as check_name;

select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('club_positions', 'volunteer_club_positions')
order by c.relname;

select slug, name, is_core_panel, status
from public.club_positions
where slug in (
  'president',
  'vice-president',
  'general-secretary',
  'joint-secretary',
  'treasurer',
  'organizing-secretary',
  'executive-member'
)
order by display_order;

select count(*) as volunteer_position_assignments
from public.volunteer_club_positions;

select proname, prosecdef as security_definer
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'create_club_position',
    'update_club_position',
    'archive_club_position',
    'assign_volunteer_club_position',
    'complete_volunteer_club_position',
    'revoke_volunteer_club_position',
    'change_primary_club_position',
    'submit_volunteer_onboarding'
  )
order by proname;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in ('club_positions', 'volunteer_club_positions')
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
order by table_name, grantee, privilege_type;

select count(*) as blood_table_count
from information_schema.tables
where table_schema = 'public'
  and table_name like 'blood_%';
