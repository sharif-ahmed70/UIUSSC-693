-- UIUSSC draft: club management and Blood Support foundation
-- Version: 202606240001
-- Status: draft only. Do not apply remotely until reviewed.

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

create or replace function public.generate_blood_request_reference()
returns text
language sql
volatile
as $$
  select 'BB-' || upper(encode(gen_random_bytes(6), 'hex'));
$$;

-- ==================================================
-- Shared club management
-- ==================================================

create table if not exists public.club_departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  short_description text,
  status text not null default 'active',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint club_departments_slug_unique unique (slug),
  constraint club_departments_status_check check (status in ('active', 'inactive', 'archived')),
  constraint club_departments_display_order_check check (display_order >= 0),
  constraint club_departments_slug_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table if not exists public.volunteer_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete restrict,
  full_name text not null,
  student_id text,
  normalized_student_id text generated always as (nullif(lower(btrim(student_id)), '')) stored,
  email text not null,
  normalized_email text generated always as (lower(btrim(email))) stored,
  phone text,
  normalized_phone text generated always as (nullif(regexp_replace(phone, '[^0-9+]', '', 'g'), '')) stored,
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
  suspended_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint volunteer_profiles_account_status_check check (account_status in ('pending', 'approved', 'rejected', 'suspended', 'archived')),
  constraint volunteer_profiles_onboarding_status_check check (onboarding_status in ('profile_incomplete', 'submitted', 'under_review', 'approved', 'rejected')),
  constraint volunteer_profiles_blood_group_check check (blood_group is null or blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'))
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
  rejection_reason text,
  suspended_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint volunteer_department_memberships_role_check check (department_role in ('volunteer', 'coordinator', 'department_head')),
  constraint volunteer_department_memberships_status_check check (membership_status in ('requested', 'under_review', 'approved', 'rejected', 'suspended', 'removed')),
  constraint volunteer_department_memberships_no_self_approval check (approved_by is null or approved_by <> volunteer_profile_id)
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint volunteer_platform_roles_role_check check (role in ('super_admin', 'club_admin', 'membership_admin', 'content_admin', 'department_admin')),
  constraint volunteer_platform_roles_status_check check (status in ('active', 'revoked')),
  constraint volunteer_platform_roles_no_self_assign check (assigned_by is null or assigned_by <> volunteer_profile_id)
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
  changed_at timestamptz not null default now()
);

create table if not exists public.platform_role_history (
  id uuid primary key default gen_random_uuid(),
  platform_role_id uuid not null references public.volunteer_platform_roles(id) on delete restrict,
  previous_status text,
  new_status text not null,
  previous_role text,
  new_role text,
  changed_by uuid references public.volunteer_profiles(id) on delete set null,
  reason text,
  changed_at timestamptz not null default now()
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
  constraint club_audit_logs_no_sensitive_metadata check (
    not (metadata ? 'password')
    and not (metadata ? 'token')
    and not (metadata ? 'service_role_key')
  )
);

-- ==================================================
-- Blood Support
-- ==================================================

create table if not exists public.blood_donors (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  normalized_phone text not null,
  normalized_email text,
  student_id text,
  affiliation_type text not null default 'other',
  academic_department text,
  batch text,
  trimester text,
  blood_group text not null,
  current_area text not null,
  preferred_contact_channel text not null default 'phone',
  contact_consent boolean not null default false,
  emergency_opt_in boolean not null default false,
  last_verified_donation_date date,
  availability_status text not null default 'temporarily_unavailable',
  availability_updated_at timestamptz not null default now(),
  verification_status text not null default 'pending',
  verified_at timestamptz,
  verified_by uuid references public.volunteer_profiles(id) on delete set null,
  private_staff_notes text,
  active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blood_donors_blood_group_check check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  constraint blood_donors_affiliation_type_check check (affiliation_type in ('uiu_student', 'uiu_alumni', 'uiu_faculty_staff', 'guardian', 'external', 'other')),
  constraint blood_donors_contact_channel_check check (preferred_contact_channel in ('phone', 'sms', 'whatsapp', 'email')),
  constraint blood_donors_availability_status_check check (availability_status in ('available', 'temporarily_unavailable', 'unavailable', 'do_not_contact')),
  constraint blood_donors_verification_status_check check (verification_status in ('pending', 'verified', 'rejected', 'archived'))
);

create table if not exists public.blood_requests (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique default public.generate_blood_request_reference(),
  requester_name text not null,
  requester_phone text not null,
  requester_email text,
  requester_student_id text,
  requester_affiliation text not null default 'other',
  patient_name text,
  blood_group text not null,
  units_required integer not null,
  units_fulfilled integer not null default 0,
  hospital_name text not null,
  hospital_area text not null,
  required_at timestamptz not null,
  urgency text not null default 'normal',
  requester_note text,
  proof_storage_path text,
  verification_status text not null default 'pending',
  workflow_status text not null default 'submitted',
  assigned_staff_id uuid references public.volunteer_profiles(id) on delete set null,
  expires_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blood_requests_blood_group_check check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  constraint blood_requests_units_required_check check (units_required > 0),
  constraint blood_requests_units_fulfilled_check check (units_fulfilled >= 0 and units_fulfilled <= units_required),
  constraint blood_requests_affiliation_check check (requester_affiliation in ('uiu_student', 'uiu_alumni', 'uiu_faculty_staff', 'guardian', 'external', 'other')),
  constraint blood_requests_urgency_check check (urgency in ('normal', 'urgent', 'emergency')),
  constraint blood_requests_verification_status_check check (verification_status in ('pending', 'verified', 'rejected')),
  constraint blood_requests_workflow_status_check check (workflow_status in ('submitted', 'under_review', 'verified', 'matching', 'donor_contacting', 'donor_confirmed', 'partially_fulfilled', 'fulfilled', 'cancelled', 'rejected', 'expired'))
);

create table if not exists public.blood_request_status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.blood_requests(id) on delete restrict,
  previous_status text,
  new_status text not null,
  changed_by uuid references public.volunteer_profiles(id) on delete set null,
  reason text,
  changed_at timestamptz not null default now()
);

create table if not exists public.blood_donor_assignments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.blood_requests(id) on delete restrict,
  donor_id uuid not null references public.blood_donors(id) on delete restrict,
  assigned_by uuid references public.volunteer_profiles(id) on delete set null,
  assignment_status text not null default 'assigned',
  assigned_at timestamptz not null default now(),
  contacted_at timestamptz,
  responded_at timestamptz,
  units_expected integer not null default 1,
  private_notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blood_donor_assignments_status_check check (assignment_status in ('suggested', 'assigned', 'contacted', 'agreed', 'declined', 'unreachable', 'follow_up_required', 'donated', 'failed', 'cancelled')),
  constraint blood_donor_assignments_units_expected_check check (units_expected > 0)
);

create table if not exists public.blood_assignment_status_history (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.blood_donor_assignments(id) on delete restrict,
  previous_status text,
  new_status text not null,
  changed_by uuid references public.volunteer_profiles(id) on delete set null,
  reason text,
  changed_at timestamptz not null default now()
);

create table if not exists public.blood_contact_attempts (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.blood_donors(id) on delete restrict,
  request_id uuid not null references public.blood_requests(id) on delete restrict,
  assignment_id uuid references public.blood_donor_assignments(id) on delete set null,
  staff_profile_id uuid references public.volunteer_profiles(id) on delete set null,
  channel text not null,
  result text not null,
  attempted_at timestamptz not null default now(),
  next_follow_up_at timestamptz,
  safe_note text,
  created_at timestamptz not null default now(),
  constraint blood_contact_attempts_channel_check check (channel in ('phone', 'sms', 'whatsapp', 'email', 'in_person')),
  constraint blood_contact_attempts_result_check check (result in ('contacted', 'agreed', 'declined', 'unreachable', 'follow_up_required', 'wrong_number', 'do_not_contact'))
);

create table if not exists public.blood_donation_history (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.blood_donors(id) on delete restrict,
  request_id uuid references public.blood_requests(id) on delete set null,
  assignment_id uuid references public.blood_donor_assignments(id) on delete set null,
  verified_donation_date date not null,
  units integer not null default 1,
  hospital text,
  verified_by uuid references public.volunteer_profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blood_donation_history_units_check check (units > 0)
);

create table if not exists public.blood_module_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null,
  setting_type text not null default 'json',
  validation_schema jsonb,
  description text,
  requires_medical_review boolean not null default false,
  updated_by uuid references public.volunteer_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blood_module_settings_key_check check (setting_key ~ '^[a-z0-9_]+$'),
  constraint blood_module_settings_type_check check (setting_type in ('integer', 'decimal', 'boolean', 'string', 'json'))
);

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  event_type text not null,
  recipient_type text not null,
  recipient_profile_id uuid references public.volunteer_profiles(id) on delete set null,
  recipient_contact text,
  related_entity_type text,
  related_entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  attempts integer not null default 0,
  next_attempt_at timestamptz,
  provider_message_id text,
  idempotency_key text not null,
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_outbox_channel_check check (channel in ('email', 'sms', 'whatsapp', 'in_app')),
  constraint notification_outbox_recipient_type_check check (recipient_type in ('volunteer', 'requester', 'donor', 'staff_group')),
  constraint notification_outbox_status_check check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  constraint notification_outbox_attempts_check check (attempts >= 0),
  constraint notification_outbox_no_sensitive_payload check (
    not (payload ? 'password')
    and not (payload ? 'token')
    and not (payload ? 'service_role_key')
  )
);

-- ==================================================
-- Triggers
-- ==================================================

drop trigger if exists set_club_departments_updated_at on public.club_departments;
create trigger set_club_departments_updated_at before update on public.club_departments for each row execute function public.set_updated_at();

drop trigger if exists set_volunteer_profiles_updated_at on public.volunteer_profiles;
create trigger set_volunteer_profiles_updated_at before update on public.volunteer_profiles for each row execute function public.set_updated_at();

drop trigger if exists set_volunteer_department_memberships_updated_at on public.volunteer_department_memberships;
create trigger set_volunteer_department_memberships_updated_at before update on public.volunteer_department_memberships for each row execute function public.set_updated_at();

drop trigger if exists set_volunteer_platform_roles_updated_at on public.volunteer_platform_roles;
create trigger set_volunteer_platform_roles_updated_at before update on public.volunteer_platform_roles for each row execute function public.set_updated_at();

drop trigger if exists set_blood_donors_updated_at on public.blood_donors;
create trigger set_blood_donors_updated_at before update on public.blood_donors for each row execute function public.set_updated_at();

drop trigger if exists set_blood_requests_updated_at on public.blood_requests;
create trigger set_blood_requests_updated_at before update on public.blood_requests for each row execute function public.set_updated_at();

drop trigger if exists set_blood_donor_assignments_updated_at on public.blood_donor_assignments;
create trigger set_blood_donor_assignments_updated_at before update on public.blood_donor_assignments for each row execute function public.set_updated_at();

drop trigger if exists set_blood_donation_history_updated_at on public.blood_donation_history;
create trigger set_blood_donation_history_updated_at before update on public.blood_donation_history for each row execute function public.set_updated_at();

drop trigger if exists set_blood_module_settings_updated_at on public.blood_module_settings;
create trigger set_blood_module_settings_updated_at before update on public.blood_module_settings for each row execute function public.set_updated_at();

drop trigger if exists set_notification_outbox_updated_at on public.notification_outbox;
create trigger set_notification_outbox_updated_at before update on public.notification_outbox for each row execute function public.set_updated_at();

-- ==================================================
-- Indexes
-- ==================================================

create index if not exists club_departments_status_idx on public.club_departments (status);
create index if not exists club_departments_display_order_idx on public.club_departments (display_order);

create index if not exists volunteer_profiles_auth_user_id_idx on public.volunteer_profiles (auth_user_id);
create index if not exists volunteer_profiles_account_status_idx on public.volunteer_profiles (account_status);
create index if not exists volunteer_profiles_primary_department_id_idx on public.volunteer_profiles (primary_department_id);
create unique index if not exists volunteer_profiles_student_id_unique_idx on public.volunteer_profiles (normalized_student_id) where normalized_student_id is not null;
create unique index if not exists volunteer_profiles_email_unique_idx on public.volunteer_profiles (normalized_email);
create unique index if not exists volunteer_profiles_phone_unique_idx on public.volunteer_profiles (normalized_phone) where normalized_phone is not null;

create index if not exists volunteer_department_memberships_profile_idx on public.volunteer_department_memberships (volunteer_profile_id);
create index if not exists volunteer_department_memberships_department_idx on public.volunteer_department_memberships (department_id);
create index if not exists volunteer_department_memberships_status_idx on public.volunteer_department_memberships (membership_status);
create index if not exists volunteer_department_memberships_role_idx on public.volunteer_department_memberships (department_role);
create unique index if not exists volunteer_department_memberships_active_unique_idx on public.volunteer_department_memberships (volunteer_profile_id, department_id) where membership_status in ('requested', 'under_review', 'approved', 'suspended');
create unique index if not exists volunteer_department_memberships_one_primary_idx on public.volunteer_department_memberships (volunteer_profile_id) where is_primary = true and membership_status = 'approved';

create index if not exists volunteer_platform_roles_profile_idx on public.volunteer_platform_roles (volunteer_profile_id);
create index if not exists volunteer_platform_roles_status_idx on public.volunteer_platform_roles (status);
create unique index if not exists volunteer_platform_roles_active_unique_idx on public.volunteer_platform_roles (volunteer_profile_id, role) where status = 'active';

create index if not exists club_audit_logs_actor_profile_idx on public.club_audit_logs (actor_profile_id);
create index if not exists club_audit_logs_entity_idx on public.club_audit_logs (entity_type, entity_id);
create index if not exists club_audit_logs_created_at_idx on public.club_audit_logs (created_at);

create index if not exists blood_donors_blood_group_idx on public.blood_donors (blood_group);
create index if not exists blood_donors_current_area_idx on public.blood_donors (lower(current_area));
create index if not exists blood_donors_verification_status_idx on public.blood_donors (verification_status);
create index if not exists blood_donors_availability_status_idx on public.blood_donors (availability_status);
create index if not exists blood_donors_active_archived_idx on public.blood_donors (active, archived_at);
create index if not exists blood_donors_last_verified_donation_date_idx on public.blood_donors (last_verified_donation_date);
create unique index if not exists blood_donors_phone_active_unique_idx on public.blood_donors (normalized_phone) where normalized_phone is not null and btrim(normalized_phone) <> '' and archived_at is null;
create unique index if not exists blood_donors_email_active_unique_idx on public.blood_donors (lower(normalized_email)) where normalized_email is not null and btrim(normalized_email) <> '' and archived_at is null;
create unique index if not exists blood_donors_student_id_active_unique_idx on public.blood_donors (lower(trim(student_id))) where student_id is not null and btrim(student_id) <> '' and archived_at is null;

create index if not exists blood_requests_workflow_status_idx on public.blood_requests (workflow_status);
create index if not exists blood_requests_verification_status_idx on public.blood_requests (verification_status);
create index if not exists blood_requests_blood_group_idx on public.blood_requests (blood_group);
create index if not exists blood_requests_required_at_idx on public.blood_requests (required_at);
create index if not exists blood_requests_urgency_idx on public.blood_requests (urgency);
create index if not exists blood_requests_hospital_area_idx on public.blood_requests (lower(hospital_area));
create index if not exists blood_requests_expires_at_idx on public.blood_requests (expires_at);
create index if not exists blood_requests_created_at_idx on public.blood_requests (created_at);

create index if not exists blood_donor_assignments_request_idx on public.blood_donor_assignments (request_id);
create index if not exists blood_donor_assignments_donor_idx on public.blood_donor_assignments (donor_id);
create index if not exists blood_donor_assignments_status_idx on public.blood_donor_assignments (assignment_status);
create unique index if not exists blood_donor_assignments_one_active_donor_request_idx on public.blood_donor_assignments (request_id, donor_id) where assignment_status in ('suggested', 'assigned', 'contacted', 'agreed', 'follow_up_required');

create index if not exists blood_contact_attempts_donor_attempted_idx on public.blood_contact_attempts (donor_id, attempted_at desc);
create index if not exists blood_contact_attempts_request_idx on public.blood_contact_attempts (request_id);

create index if not exists blood_donation_history_donor_date_idx on public.blood_donation_history (donor_id, verified_donation_date desc);
create index if not exists blood_donation_history_request_idx on public.blood_donation_history (request_id);
create unique index if not exists notification_outbox_idempotency_key_idx on public.notification_outbox (idempotency_key);
create index if not exists notification_outbox_status_next_attempt_idx on public.notification_outbox (status, next_attempt_at, scheduled_at);

-- ==================================================
-- Grants and RLS
-- ==================================================

revoke all on table public.club_departments from anon, authenticated;
revoke all on table public.volunteer_profiles from anon, authenticated;
revoke all on table public.volunteer_department_memberships from anon, authenticated;
revoke all on table public.volunteer_platform_roles from anon, authenticated;
revoke all on table public.volunteer_status_history from anon, authenticated;
revoke all on table public.department_membership_history from anon, authenticated;
revoke all on table public.platform_role_history from anon, authenticated;
revoke all on table public.club_audit_logs from anon, authenticated;
revoke all on table public.blood_donors from anon, authenticated;
revoke all on table public.blood_requests from anon, authenticated;
revoke all on table public.blood_request_status_history from anon, authenticated;
revoke all on table public.blood_donor_assignments from anon, authenticated;
revoke all on table public.blood_assignment_status_history from anon, authenticated;
revoke all on table public.blood_contact_attempts from anon, authenticated;
revoke all on table public.blood_donation_history from anon, authenticated;
revoke all on table public.blood_module_settings from anon, authenticated;
revoke all on table public.notification_outbox from anon, authenticated;

grant insert (
  full_name,
  normalized_phone,
  normalized_email,
  student_id,
  affiliation_type,
  academic_department,
  batch,
  trimester,
  blood_group,
  current_area,
  preferred_contact_channel,
  contact_consent,
  emergency_opt_in
) on public.blood_donors to anon, authenticated;

grant insert (
  requester_name,
  requester_phone,
  requester_email,
  requester_student_id,
  requester_affiliation,
  patient_name,
  blood_group,
  units_required,
  hospital_name,
  hospital_area,
  required_at,
  urgency,
  requester_note
) on public.blood_requests to anon, authenticated;

alter table public.club_departments enable row level security;
alter table public.volunteer_profiles enable row level security;
alter table public.volunteer_department_memberships enable row level security;
alter table public.volunteer_platform_roles enable row level security;
alter table public.volunteer_status_history enable row level security;
alter table public.department_membership_history enable row level security;
alter table public.platform_role_history enable row level security;
alter table public.club_audit_logs enable row level security;
alter table public.blood_donors enable row level security;
alter table public.blood_requests enable row level security;
alter table public.blood_request_status_history enable row level security;
alter table public.blood_donor_assignments enable row level security;
alter table public.blood_assignment_status_history enable row level security;
alter table public.blood_contact_attempts enable row level security;
alter table public.blood_donation_history enable row level security;
alter table public.blood_module_settings enable row level security;
alter table public.notification_outbox enable row level security;

drop policy if exists "Public can submit donor interest" on public.blood_donors;
create policy "Public can submit donor interest"
on public.blood_donors
for insert
to anon, authenticated
with check (
  verification_status = 'pending'
  and active = true
  and archived_at is null
  and verified_at is null
  and verified_by is null
  and private_staff_notes is null
);

drop policy if exists "Public can submit blood request" on public.blood_requests;
create policy "Public can submit blood request"
on public.blood_requests
for insert
to anon, authenticated
with check (
  verification_status = 'pending'
  and workflow_status = 'submitted'
  and units_fulfilled = 0
  and assigned_staff_id is null
  and archived_at is null
);

-- Admin/staff SELECT/UPDATE/DELETE policies are intentionally not created in this draft.
-- They must be reviewed with the final authorization helper model before deployment.
