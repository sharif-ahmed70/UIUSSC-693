-- UIUSSC Phase CM-1: secure Club Management foundation
-- Version: 202606240002

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ==================================================
-- 1. Tables
-- ==================================================

create table if not exists public.club_departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  short_description text,
  status text not null default 'active',
  display_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint club_departments_slug_unique unique (slug),
  constraint club_departments_status_check check (status in ('active', 'inactive', 'archived')),
  constraint club_departments_display_order_check check (display_order >= 0),
  constraint club_departments_slug_check check (slug = lower(btrim(slug)) and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint club_departments_archive_consistency_check check (
    (status = 'archived' and archived_at is not null)
    or (status <> 'archived')
  )
);

create table if not exists public.volunteer_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete restrict,
  full_name text not null,
  student_id text,
  student_id_normalized text generated always as (nullif(lower(btrim(student_id)), '')) stored,
  email text not null,
  email_normalized text generated always as (nullif(lower(btrim(email)), '')) stored,
  phone text,
  phone_normalized text generated always as (nullif(regexp_replace(phone, '[^0-9+]', '', 'g'), '')) stored,
  academic_department text,
  trimester text,
  blood_group text,
  profile_photo_path text,
  account_status text not null default 'pending',
  onboarding_status text not null default 'profile_incomplete',
  primary_department_id uuid references public.club_departments(id) on delete set null,
  joined_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references public.volunteer_profiles(id) on delete set null,
  rejected_at timestamptz,
  rejected_by uuid references public.volunteer_profiles(id) on delete set null,
  rejection_reason text,
  suspended_at timestamptz,
  suspended_by uuid references public.volunteer_profiles(id) on delete set null,
  suspension_reason text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint volunteer_profiles_account_status_check check (account_status in ('pending', 'approved', 'rejected', 'suspended', 'archived')),
  constraint volunteer_profiles_onboarding_status_check check (onboarding_status in ('profile_incomplete', 'submitted', 'under_review', 'approved', 'rejected')),
  constraint volunteer_profiles_blood_group_check check (blood_group is null or blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  constraint volunteer_profiles_email_nonblank_check check (btrim(email) <> ''),
  constraint volunteer_profiles_archive_consistency_check check (
    (account_status = 'archived' and archived_at is not null)
    or (account_status <> 'archived')
  )
);

create table if not exists public.volunteer_department_memberships (
  id uuid primary key default gen_random_uuid(),
  volunteer_profile_id uuid not null references public.volunteer_profiles(id) on delete restrict,
  department_id uuid not null references public.club_departments(id) on delete restrict,
  department_role text not null default 'volunteer',
  membership_status text not null default 'requested',
  is_primary boolean not null default false,
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.volunteer_profiles(id) on delete set null,
  rejected_at timestamptz,
  rejected_by uuid references public.volunteer_profiles(id) on delete set null,
  rejection_reason text,
  suspended_at timestamptz,
  suspended_by uuid references public.volunteer_profiles(id) on delete set null,
  suspension_reason text,
  removed_at timestamptz,
  removed_by uuid references public.volunteer_profiles(id) on delete set null,
  removal_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint volunteer_department_memberships_role_check check (department_role in ('volunteer', 'coordinator', 'department_head')),
  constraint volunteer_department_memberships_status_check check (membership_status in ('requested', 'under_review', 'approved', 'rejected', 'suspended', 'removed')),
  constraint volunteer_department_memberships_no_self_approval check (approved_by is null or approved_by <> volunteer_profile_id),
  constraint volunteer_department_memberships_no_self_rejection check (rejected_by is null or rejected_by <> volunteer_profile_id),
  constraint volunteer_department_memberships_no_self_suspension check (suspended_by is null or suspended_by <> volunteer_profile_id),
  constraint volunteer_department_memberships_no_self_removal check (removed_by is null or removed_by <> volunteer_profile_id)
);

create table if not exists public.volunteer_platform_roles (
  id uuid primary key default gen_random_uuid(),
  volunteer_profile_id uuid not null references public.volunteer_profiles(id) on delete restrict,
  role text not null,
  status text not null default 'active',
  assigned_by uuid references public.volunteer_profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  revoked_by uuid references public.volunteer_profiles(id) on delete set null,
  revoked_at timestamptz,
  revocation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint volunteer_platform_roles_role_check check (role in ('super_admin', 'club_admin', 'membership_admin', 'content_admin', 'department_admin')),
  constraint volunteer_platform_roles_status_check check (status in ('active', 'revoked')),
  constraint volunteer_platform_roles_no_self_assign check (assigned_by is null or assigned_by <> volunteer_profile_id),
  constraint volunteer_platform_roles_no_self_revoke check (revoked_by is null or revoked_by <> volunteer_profile_id)
);

create table if not exists public.volunteer_status_history (
  id uuid primary key default gen_random_uuid(),
  volunteer_profile_id uuid not null references public.volunteer_profiles(id) on delete restrict,
  previous_status text,
  new_status text not null,
  changed_by uuid references public.volunteer_profiles(id) on delete set null,
  reason text,
  changed_at timestamptz not null default now(),
  constraint volunteer_status_history_status_check check (
    (previous_status is null or previous_status in ('pending', 'approved', 'rejected', 'suspended', 'archived'))
    and new_status in ('pending', 'approved', 'rejected', 'suspended', 'archived')
  )
);

create table if not exists public.department_membership_history (
  id uuid primary key default gen_random_uuid(),
  department_membership_id uuid not null references public.volunteer_department_memberships(id) on delete restrict,
  previous_status text,
  new_status text not null,
  previous_role text,
  new_role text,
  changed_by uuid references public.volunteer_profiles(id) on delete set null,
  reason text,
  changed_at timestamptz not null default now(),
  constraint department_membership_history_status_check check (
    (previous_status is null or previous_status in ('requested', 'under_review', 'approved', 'rejected', 'suspended', 'removed'))
    and new_status in ('requested', 'under_review', 'approved', 'rejected', 'suspended', 'removed')
  ),
  constraint department_membership_history_role_check check (
    (previous_role is null or previous_role in ('volunteer', 'coordinator', 'department_head'))
    and (new_role is null or new_role in ('volunteer', 'coordinator', 'department_head'))
  )
);

create table if not exists public.club_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.volunteer_profiles(id) on delete set null,
  actor_auth_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  department_id uuid references public.club_departments(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint club_audit_logs_action_nonblank_check check (btrim(action) <> ''),
  constraint club_audit_logs_entity_type_nonblank_check check (btrim(entity_type) <> ''),
  constraint club_audit_logs_safe_metadata_check check (
    not (metadata ? 'password')
    and not (metadata ? 'token')
    and not (metadata ? 'service_role_key')
    and not (metadata ? 'supabase_key')
    and not (metadata ? 'connection_string')
  )
);

-- ==================================================
-- 2. Updated-at triggers
-- ==================================================

drop trigger if exists set_club_departments_updated_at on public.club_departments;
create trigger set_club_departments_updated_at
before update on public.club_departments
for each row execute function public.set_updated_at();

drop trigger if exists set_volunteer_profiles_updated_at on public.volunteer_profiles;
create trigger set_volunteer_profiles_updated_at
before update on public.volunteer_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_volunteer_department_memberships_updated_at on public.volunteer_department_memberships;
create trigger set_volunteer_department_memberships_updated_at
before update on public.volunteer_department_memberships
for each row execute function public.set_updated_at();

drop trigger if exists set_volunteer_platform_roles_updated_at on public.volunteer_platform_roles;
create trigger set_volunteer_platform_roles_updated_at
before update on public.volunteer_platform_roles
for each row execute function public.set_updated_at();

-- ==================================================
-- 3. Indexes
-- ==================================================

create index if not exists club_departments_status_idx on public.club_departments (status);
create index if not exists club_departments_display_order_idx on public.club_departments (display_order);

create index if not exists volunteer_profiles_auth_user_id_idx on public.volunteer_profiles (auth_user_id);
create index if not exists volunteer_profiles_account_status_idx on public.volunteer_profiles (account_status);
create index if not exists volunteer_profiles_onboarding_status_idx on public.volunteer_profiles (onboarding_status);
create index if not exists volunteer_profiles_primary_department_id_idx on public.volunteer_profiles (primary_department_id);
create unique index if not exists volunteer_profiles_student_id_unique_idx on public.volunteer_profiles (student_id_normalized) where student_id_normalized is not null;
create unique index if not exists volunteer_profiles_email_unique_idx on public.volunteer_profiles (email_normalized) where email_normalized is not null;
create index if not exists volunteer_profiles_phone_normalized_idx on public.volunteer_profiles (phone_normalized) where phone_normalized is not null;

create index if not exists volunteer_department_memberships_profile_idx on public.volunteer_department_memberships (volunteer_profile_id);
create index if not exists volunteer_department_memberships_department_idx on public.volunteer_department_memberships (department_id);
create index if not exists volunteer_department_memberships_status_idx on public.volunteer_department_memberships (membership_status);
create index if not exists volunteer_department_memberships_role_idx on public.volunteer_department_memberships (department_role);
create unique index if not exists volunteer_department_memberships_unique_department_idx
on public.volunteer_department_memberships (volunteer_profile_id, department_id);
create unique index if not exists volunteer_department_memberships_one_approved_primary_idx
on public.volunteer_department_memberships (volunteer_profile_id)
where is_primary = true and membership_status = 'approved';
create unique index if not exists volunteer_department_memberships_one_active_primary_request_idx
on public.volunteer_department_memberships (volunteer_profile_id)
where is_primary = true and membership_status in ('requested', 'under_review', 'approved');

create index if not exists volunteer_platform_roles_profile_idx on public.volunteer_platform_roles (volunteer_profile_id);
create index if not exists volunteer_platform_roles_status_idx on public.volunteer_platform_roles (status);
create unique index if not exists volunteer_platform_roles_active_unique_idx
on public.volunteer_platform_roles (volunteer_profile_id, role)
where status = 'active';

create index if not exists volunteer_status_history_profile_changed_at_idx on public.volunteer_status_history (volunteer_profile_id, changed_at desc);
create index if not exists department_membership_history_membership_changed_at_idx on public.department_membership_history (department_membership_id, changed_at desc);

create index if not exists club_audit_logs_actor_profile_idx on public.club_audit_logs (actor_profile_id);
create index if not exists club_audit_logs_actor_auth_user_idx on public.club_audit_logs (actor_auth_user_id);
create index if not exists club_audit_logs_action_idx on public.club_audit_logs (action);
create index if not exists club_audit_logs_entity_idx on public.club_audit_logs (entity_type, entity_id);
create index if not exists club_audit_logs_department_idx on public.club_audit_logs (department_id);
create index if not exists club_audit_logs_created_at_idx on public.club_audit_logs (created_at desc);

-- ==================================================
-- 4. Seed non-personal initial departments
-- ==================================================

insert into public.club_departments (name, slug, short_description, status, display_order)
values
  ('Blood Department', 'blood', 'Coordinates blood requests, donor records, matching, and donation history.', 'active', 10),
  ('Event Management', 'event-management', 'Plans and executes club events.', 'active', 20),
  ('Volunteer Management', 'volunteer-management', 'Coordinates volunteer pool, assignments, and attendance.', 'active', 30),
  ('Logistics', 'logistics', 'Manages resources, transport, and event logistics.', 'active', 40),
  ('Graphics Design', 'graphics-design', 'Handles design requests, assets, and creative approvals.', 'active', 50),
  ('Public Relations', 'public-relations', 'Handles campaigns, communication, and collaboration records.', 'active', 60),
  ('Human Resources', 'human-resources', 'Reviews membership, onboarding, department assignment, and volunteer status.', 'active', 70)
on conflict (slug) do update
set
  name = excluded.name,
  short_description = excluded.short_description,
  display_order = excluded.display_order,
  updated_at = now()
where public.club_departments.status <> 'archived';

-- ==================================================
-- 5. Grants
-- ==================================================

revoke all on table public.club_departments from anon, authenticated;
revoke all on table public.volunteer_profiles from anon, authenticated;
revoke all on table public.volunteer_department_memberships from anon, authenticated;
revoke all on table public.volunteer_platform_roles from anon, authenticated;
revoke all on table public.volunteer_status_history from anon, authenticated;
revoke all on table public.department_membership_history from anon, authenticated;
revoke all on table public.club_audit_logs from anon, authenticated;

grant select (
  name,
  slug,
  short_description,
  display_order
) on public.club_departments to anon, authenticated;

grant select (
  id,
  auth_user_id,
  full_name,
  student_id,
  student_id_normalized,
  email,
  email_normalized,
  phone,
  phone_normalized,
  academic_department,
  trimester,
  blood_group,
  profile_photo_path,
  account_status,
  onboarding_status,
  primary_department_id,
  joined_at,
  approved_at,
  rejected_at,
  rejection_reason,
  suspended_at,
  suspension_reason,
  archived_at,
  created_at,
  updated_at
) on public.volunteer_profiles to authenticated;

grant insert (
  auth_user_id,
  full_name,
  student_id,
  email,
  phone,
  academic_department,
  trimester,
  blood_group,
  profile_photo_path
) on public.volunteer_profiles to authenticated;

grant update (
  full_name,
  student_id,
  email,
  phone,
  academic_department,
  trimester,
  blood_group,
  profile_photo_path
) on public.volunteer_profiles to authenticated;

grant select (
  id,
  volunteer_profile_id,
  department_id,
  department_role,
  membership_status,
  is_primary,
  requested_at,
  approved_at,
  rejected_at,
  rejection_reason,
  suspended_at,
  suspension_reason,
  removed_at,
  removal_reason,
  created_at,
  updated_at
) on public.volunteer_department_memberships to authenticated;

grant insert (
  volunteer_profile_id,
  department_id
) on public.volunteer_department_memberships to authenticated;

grant select (
  id,
  volunteer_profile_id,
  previous_status,
  new_status,
  reason,
  changed_at
) on public.volunteer_status_history to authenticated;

grant select (
  id,
  department_membership_id,
  previous_status,
  new_status,
  previous_role,
  new_role,
  reason,
  changed_at
) on public.department_membership_history to authenticated;

-- No normal client grants for platform roles or audit logs in CM-1.

-- ==================================================
-- 6. Row Level Security
-- ==================================================

alter table public.club_departments enable row level security;
alter table public.volunteer_profiles enable row level security;
alter table public.volunteer_department_memberships enable row level security;
alter table public.volunteer_platform_roles enable row level security;
alter table public.volunteer_status_history enable row level security;
alter table public.department_membership_history enable row level security;
alter table public.club_audit_logs enable row level security;

drop policy if exists "Public can read active department metadata" on public.club_departments;
create policy "Public can read active department metadata"
on public.club_departments
for select
to anon, authenticated
using (status = 'active' and archived_at is null);

drop policy if exists "Authenticated users can read own volunteer profile" on public.volunteer_profiles;
create policy "Authenticated users can read own volunteer profile"
on public.volunteer_profiles
for select
to authenticated
using (auth.uid() = auth_user_id);

drop policy if exists "Authenticated users can insert own volunteer profile" on public.volunteer_profiles;
create policy "Authenticated users can insert own volunteer profile"
on public.volunteer_profiles
for insert
to authenticated
with check (
  auth.uid() = auth_user_id
  and account_status = 'pending'
  and onboarding_status = 'profile_incomplete'
  and primary_department_id is null
  and approved_at is null
  and approved_by is null
  and rejected_at is null
  and rejected_by is null
  and rejection_reason is null
  and suspended_at is null
  and suspended_by is null
  and suspension_reason is null
  and archived_at is null
);

drop policy if exists "Authenticated users can update safe own volunteer profile fields" on public.volunteer_profiles;
create policy "Authenticated users can update safe own volunteer profile fields"
on public.volunteer_profiles
for update
to authenticated
using (auth.uid() = auth_user_id)
with check (
  auth.uid() = auth_user_id
  and account_status in ('pending', 'approved')
  and archived_at is null
);

drop policy if exists "Authenticated users can read own department memberships" on public.volunteer_department_memberships;
create policy "Authenticated users can read own department memberships"
on public.volunteer_department_memberships
for select
to authenticated
using (
  exists (
    select 1
    from public.volunteer_profiles
    where volunteer_profiles.id = volunteer_department_memberships.volunteer_profile_id
      and volunteer_profiles.auth_user_id = auth.uid()
  )
);

drop policy if exists "Authenticated users can request active department membership" on public.volunteer_department_memberships;
create policy "Authenticated users can request active department membership"
on public.volunteer_department_memberships
for insert
to authenticated
with check (
  department_role = 'volunteer'
  and membership_status = 'requested'
  and is_primary = false
  and approved_at is null
  and approved_by is null
  and rejected_at is null
  and rejected_by is null
  and rejection_reason is null
  and suspended_at is null
  and suspended_by is null
  and suspension_reason is null
  and removed_at is null
  and removed_by is null
  and removal_reason is null
  and exists (
    select 1
    from public.volunteer_profiles
    where volunteer_profiles.id = volunteer_department_memberships.volunteer_profile_id
      and volunteer_profiles.auth_user_id = auth.uid()
      and volunteer_profiles.account_status in ('pending', 'approved')
      and volunteer_profiles.archived_at is null
  )
  and exists (
    select 1
    from public.club_departments
    where club_departments.id = volunteer_department_memberships.department_id
      and club_departments.status = 'active'
      and club_departments.archived_at is null
  )
);

drop policy if exists "Authenticated users can read own volunteer status history" on public.volunteer_status_history;
create policy "Authenticated users can read own volunteer status history"
on public.volunteer_status_history
for select
to authenticated
using (
  exists (
    select 1
    from public.volunteer_profiles
    where volunteer_profiles.id = volunteer_status_history.volunteer_profile_id
      and volunteer_profiles.auth_user_id = auth.uid()
  )
);

drop policy if exists "Authenticated users can read own department membership history" on public.department_membership_history;
create policy "Authenticated users can read own department membership history"
on public.department_membership_history
for select
to authenticated
using (
  exists (
    select 1
    from public.volunteer_department_memberships
    join public.volunteer_profiles
      on volunteer_profiles.id = volunteer_department_memberships.volunteer_profile_id
    where volunteer_department_memberships.id = department_membership_history.department_membership_id
      and volunteer_profiles.auth_user_id = auth.uid()
  )
);
