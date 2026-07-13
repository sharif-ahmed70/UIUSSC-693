-- UIUSSC BB-1: secure Blood Support database foundation
-- Version: 202606240008

create extension if not exists pgcrypto;

create or replace function public.generate_blood_request_reference()
returns text
language sql
volatile
set search_path = public, pg_temp
as $$
  select 'BS-' || upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 12))
$$;

create table if not exists public.blood_support_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb not null default '{}'::jsonb,
  description text,
  is_active boolean not null default true,
  updated_by uuid references public.volunteer_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blood_support_settings_key_check check (setting_key ~ '^[a-z0-9_]+$'),
  constraint blood_support_settings_no_secret_values check (
    not (setting_value ? 'password')
    and not (setting_value ? 'token')
    and not (setting_value ? 'secret')
    and not (setting_value ? 'service_role_key')
  )
);

create table if not exists public.blood_donor_profiles (
  id uuid primary key default gen_random_uuid(),
  volunteer_profile_id uuid references public.volunteer_profiles(id) on delete restrict,
  display_name text not null,
  blood_group text not null,
  district text,
  area text,
  source text not null default 'staff_entry',
  verification_status text not null default 'pending_review',
  availability_status text not null default 'unknown',
  self_reported_last_donation_date date,
  self_reported_available_from date,
  consent_to_contact boolean not null default false,
  consent_recorded_at timestamptz,
  reviewed_by uuid references public.volunteer_profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  duplicate_review_required boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blood_donor_profiles_blood_group_check check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  constraint blood_donor_profiles_source_check check (source in ('public_interest', 'volunteer_profile', 'staff_entry', 'approved_import')),
  constraint blood_donor_profiles_verification_status_check check (verification_status in ('pending_review', 'under_review', 'verified', 'rejected', 'duplicate_flagged', 'archived')),
  constraint blood_donor_profiles_availability_status_check check (availability_status in ('unknown', 'available', 'temporarily_unavailable', 'unavailable', 'do_not_contact')),
  constraint blood_donor_profiles_archive_consistency_check check (
    (verification_status = 'archived' and archived_at is not null)
    or verification_status <> 'archived'
  ),
  constraint blood_donor_profiles_consent_time_check check (
    (consent_to_contact = true and consent_recorded_at is not null)
    or consent_to_contact = false
  )
);

create table if not exists public.blood_donor_contacts (
  id uuid primary key default gen_random_uuid(),
  donor_profile_id uuid not null unique references public.blood_donor_profiles(id) on delete restrict,
  phone text,
  normalized_phone text,
  email text,
  normalized_email text,
  alternate_phone text,
  preferred_contact_method text not null default 'phone',
  contact_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blood_donor_contacts_method_check check (preferred_contact_method in ('phone', 'sms', 'whatsapp', 'email'))
);

create table if not exists public.blood_requests (
  id uuid primary key default gen_random_uuid(),
  public_reference_code text not null unique default public.generate_blood_request_reference(),
  blood_group text not null,
  component_type text not null default 'whole_blood',
  units_requested integer not null,
  units_fulfilled integer not null default 0,
  urgency text not null default 'normal',
  hospital_name text not null,
  hospital_area text,
  district text,
  needed_at timestamptz not null,
  request_status text not null default 'submitted',
  patient_reference text,
  requester_relationship text,
  source text not null default 'staff_entry',
  reviewed_by uuid references public.volunteer_profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  cancellation_reason text,
  expires_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blood_requests_blood_group_check check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  constraint blood_requests_component_check check (component_type in ('whole_blood', 'packed_red_cells', 'platelets', 'plasma', 'other')),
  constraint blood_requests_units_requested_check check (units_requested > 0),
  constraint blood_requests_units_fulfilled_check check (units_fulfilled >= 0),
  constraint blood_requests_units_fulfilled_limit_check check (units_fulfilled <= units_requested),
  constraint blood_requests_urgency_check check (urgency in ('normal', 'urgent', 'emergency')),
  constraint blood_requests_status_check check (request_status in ('submitted', 'under_review', 'approved', 'matching', 'partially_fulfilled', 'fulfilled', 'rejected', 'cancelled', 'expired', 'archived')),
  constraint blood_requests_source_check check (source in ('public_request', 'staff_entry', 'approved_import')),
  constraint blood_requests_archive_consistency_check check (
    (request_status = 'archived' and archived_at is not null)
    or request_status <> 'archived'
  )
);

create table if not exists public.blood_request_contacts (
  id uuid primary key default gen_random_uuid(),
  blood_request_id uuid not null unique references public.blood_requests(id) on delete restrict,
  requester_name text not null,
  phone text not null,
  normalized_phone text not null,
  alternate_phone text,
  email text,
  normalized_email text,
  preferred_contact_method text not null default 'phone',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blood_request_contacts_method_check check (preferred_contact_method in ('phone', 'sms', 'whatsapp', 'email'))
);

create table if not exists public.blood_matches (
  id uuid primary key default gen_random_uuid(),
  blood_request_id uuid not null references public.blood_requests(id) on delete restrict,
  donor_profile_id uuid not null references public.blood_donor_profiles(id) on delete restrict,
  match_status text not null default 'suggested',
  suggested_by uuid references public.volunteer_profiles(id) on delete set null,
  reviewed_by uuid references public.volunteer_profiles(id) on delete set null,
  contact_authorized_by uuid references public.volunteer_profiles(id) on delete set null,
  contact_authorized_at timestamptz,
  contacted_by uuid references public.volunteer_profiles(id) on delete set null,
  contacted_at timestamptz,
  donor_response_at timestamptz,
  confirmation_at timestamptz,
  completed_at timestamptz,
  cancellation_reason text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blood_matches_status_check check (match_status in ('suggested', 'shortlisted', 'approved_for_contact', 'contacted', 'interested', 'declined', 'unavailable', 'confirmed', 'completed', 'cancelled'))
);

create table if not exists public.blood_donations (
  id uuid primary key default gen_random_uuid(),
  blood_request_id uuid not null references public.blood_requests(id) on delete restrict,
  donor_profile_id uuid not null references public.blood_donor_profiles(id) on delete restrict,
  blood_match_id uuid references public.blood_matches(id) on delete set null,
  reported_units integer not null,
  verified_units integer not null default 0,
  donation_status text not null default 'reported',
  donation_date date,
  hospital_reference text,
  reported_by uuid references public.volunteer_profiles(id) on delete set null,
  verified_by uuid references public.volunteer_profiles(id) on delete set null,
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blood_donations_reported_units_check check (reported_units > 0),
  constraint blood_donations_verified_units_check check (verified_units >= 0 and verified_units <= reported_units),
  constraint blood_donations_status_check check (donation_status in ('reported', 'under_review', 'verified', 'rejected', 'cancelled'))
);

create table if not exists public.blood_donor_status_history (
  id uuid primary key default gen_random_uuid(),
  donor_profile_id uuid not null references public.blood_donor_profiles(id) on delete restrict,
  previous_status text,
  new_status text not null,
  changed_by uuid references public.volunteer_profiles(id) on delete set null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  changed_at timestamptz not null default now(),
  constraint blood_donor_status_history_no_sensitive_metadata check (
    not (metadata ? 'phone') and not (metadata ? 'email') and not (metadata ? 'token') and not (metadata ? 'secret')
  )
);

create table if not exists public.blood_request_status_history (
  id uuid primary key default gen_random_uuid(),
  blood_request_id uuid not null references public.blood_requests(id) on delete restrict,
  previous_status text,
  new_status text not null,
  changed_by uuid references public.volunteer_profiles(id) on delete set null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  changed_at timestamptz not null default now(),
  constraint blood_request_status_history_no_sensitive_metadata check (
    not (metadata ? 'phone') and not (metadata ? 'email') and not (metadata ? 'token') and not (metadata ? 'secret')
  )
);

create table if not exists public.blood_match_status_history (
  id uuid primary key default gen_random_uuid(),
  blood_match_id uuid not null references public.blood_matches(id) on delete restrict,
  previous_status text,
  new_status text not null,
  changed_by uuid references public.volunteer_profiles(id) on delete set null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  changed_at timestamptz not null default now(),
  constraint blood_match_status_history_no_sensitive_metadata check (
    not (metadata ? 'phone') and not (metadata ? 'email') and not (metadata ? 'token') and not (metadata ? 'secret')
  )
);

create table if not exists public.blood_donation_status_history (
  id uuid primary key default gen_random_uuid(),
  blood_donation_id uuid not null references public.blood_donations(id) on delete restrict,
  previous_status text,
  new_status text not null,
  changed_by uuid references public.volunteer_profiles(id) on delete set null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  changed_at timestamptz not null default now(),
  constraint blood_donation_status_history_no_sensitive_metadata check (
    not (metadata ? 'phone') and not (metadata ? 'email') and not (metadata ? 'token') and not (metadata ? 'secret')
  )
);

create table if not exists public.blood_donor_duplicate_reviews (
  id uuid primary key default gen_random_uuid(),
  donor_profile_id uuid not null references public.blood_donor_profiles(id) on delete restrict,
  possible_duplicate_donor_id uuid not null references public.blood_donor_profiles(id) on delete restrict,
  match_reason text not null,
  review_status text not null default 'pending',
  reviewed_by uuid references public.volunteer_profiles(id) on delete set null,
  reviewed_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default now(),
  constraint blood_donor_duplicate_reviews_status_check check (review_status in ('pending', 'confirmed_duplicate', 'not_duplicate', 'ignored', 'archived')),
  constraint blood_donor_duplicate_reviews_not_self_check check (donor_profile_id <> possible_duplicate_donor_id)
);

drop trigger if exists set_blood_support_settings_updated_at on public.blood_support_settings;
create trigger set_blood_support_settings_updated_at before update on public.blood_support_settings for each row execute function public.set_updated_at();
drop trigger if exists set_blood_donor_profiles_updated_at on public.blood_donor_profiles;
create trigger set_blood_donor_profiles_updated_at before update on public.blood_donor_profiles for each row execute function public.set_updated_at();
drop trigger if exists set_blood_donor_contacts_updated_at on public.blood_donor_contacts;
create trigger set_blood_donor_contacts_updated_at before update on public.blood_donor_contacts for each row execute function public.set_updated_at();
drop trigger if exists set_blood_requests_updated_at on public.blood_requests;
create trigger set_blood_requests_updated_at before update on public.blood_requests for each row execute function public.set_updated_at();
drop trigger if exists set_blood_request_contacts_updated_at on public.blood_request_contacts;
create trigger set_blood_request_contacts_updated_at before update on public.blood_request_contacts for each row execute function public.set_updated_at();
drop trigger if exists set_blood_matches_updated_at on public.blood_matches;
create trigger set_blood_matches_updated_at before update on public.blood_matches for each row execute function public.set_updated_at();
drop trigger if exists set_blood_donations_updated_at on public.blood_donations;
create trigger set_blood_donations_updated_at before update on public.blood_donations for each row execute function public.set_updated_at();

create index if not exists blood_donor_profiles_verification_idx on public.blood_donor_profiles (verification_status);
create index if not exists blood_donor_profiles_availability_idx on public.blood_donor_profiles (availability_status);
create index if not exists blood_donor_profiles_blood_group_idx on public.blood_donor_profiles (blood_group);
create index if not exists blood_donor_contacts_normalized_phone_idx on public.blood_donor_contacts (normalized_phone) where normalized_phone is not null;
create index if not exists blood_donor_contacts_normalized_email_idx on public.blood_donor_contacts (normalized_email) where normalized_email is not null;
create unique index if not exists blood_donor_profiles_one_active_volunteer_idx on public.blood_donor_profiles (volunteer_profile_id) where volunteer_profile_id is not null and archived_at is null;
create index if not exists blood_requests_status_idx on public.blood_requests (request_status);
create index if not exists blood_requests_blood_group_idx on public.blood_requests (blood_group);
create index if not exists blood_requests_needed_at_idx on public.blood_requests (needed_at);
create index if not exists blood_requests_urgency_idx on public.blood_requests (urgency);
create index if not exists blood_request_contacts_normalized_phone_idx on public.blood_request_contacts (normalized_phone);
create index if not exists blood_request_contacts_normalized_email_idx on public.blood_request_contacts (normalized_email) where normalized_email is not null;
create index if not exists blood_matches_request_idx on public.blood_matches (blood_request_id);
create index if not exists blood_matches_donor_idx on public.blood_matches (donor_profile_id);
create index if not exists blood_matches_status_idx on public.blood_matches (match_status);
create unique index if not exists blood_matches_one_active_request_donor_idx on public.blood_matches (blood_request_id, donor_profile_id) where match_status in ('suggested', 'shortlisted', 'approved_for_contact', 'contacted', 'interested', 'confirmed');
create index if not exists blood_donations_request_idx on public.blood_donations (blood_request_id);
create index if not exists blood_donations_donor_idx on public.blood_donations (donor_profile_id);
create index if not exists blood_donations_status_idx on public.blood_donations (donation_status);
create index if not exists blood_donor_status_history_entity_time_idx on public.blood_donor_status_history (donor_profile_id, changed_at desc);
create index if not exists blood_request_status_history_entity_time_idx on public.blood_request_status_history (blood_request_id, changed_at desc);
create index if not exists blood_match_status_history_entity_time_idx on public.blood_match_status_history (blood_match_id, changed_at desc);
create index if not exists blood_donation_status_history_entity_time_idx on public.blood_donation_status_history (blood_donation_id, changed_at desc);
create index if not exists blood_donor_duplicate_reviews_status_idx on public.blood_donor_duplicate_reviews (review_status);

insert into public.blood_support_settings (setting_key, setting_value, description, is_active)
values
  ('module_enabled', 'true'::jsonb, 'Enable the protected Blood Support module.', true),
  ('public_request_intake_enabled', 'false'::jsonb, 'Public blood request intake remains disabled during BB-1.', true),
  ('public_donor_interest_enabled', 'false'::jsonb, 'Public donor-interest intake remains disabled during BB-1.', true),
  ('default_request_expiry_hours', '72'::jsonb, 'Default request expiry window for later intake workflows.', true),
  ('contact_exposure_requires_authorized_match', 'true'::jsonb, 'Donor/request contacts are exposed only through authorized match workflow.', true),
  ('human_review_required', 'true'::jsonb, 'Human review is required before operational use.', true),
  ('donation_verification_required', 'true'::jsonb, 'Only verified donations contribute to fulfilment.', true)
on conflict (setting_key) do update
set setting_value = excluded.setting_value,
    description = excluded.description,
    is_active = excluded.is_active;

create or replace function public.blood_department_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select id from public.club_departments where slug = 'blood' and status = 'active' and archived_at is null limit 1
$$;

create or replace function public.is_blood_department_member()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_active_department_role(public.blood_department_id(), array['volunteer', 'coordinator', 'department_head'])
$$;

create or replace function public.has_blood_department_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_active_department_role(public.blood_department_id(), allowed_roles)
$$;

create or replace function public.can_view_blood_operations()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_any_active_platform_role(array['super_admin', 'club_admin'])
    or public.has_blood_department_role(array['coordinator', 'department_head'])
$$;

create or replace function public.can_manage_blood_donors()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_any_active_platform_role(array['super_admin', 'club_admin'])
    or public.has_blood_department_role(array['coordinator', 'department_head'])
$$;

create or replace function public.can_manage_blood_requests()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_any_active_platform_role(array['super_admin', 'club_admin'])
    or public.has_blood_department_role(array['coordinator', 'department_head'])
$$;

create or replace function public.can_manage_blood_matches()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_any_active_platform_role(array['super_admin', 'club_admin'])
    or public.has_blood_department_role(array['coordinator', 'department_head'])
$$;

create or replace function public.can_verify_blood_donations()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_any_active_platform_role(array['super_admin'])
    or public.has_blood_department_role(array['department_head'])
$$;

create or replace function public.can_manage_blood_settings()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select public.has_any_active_platform_role(array['super_admin'])
    or public.has_blood_department_role(array['department_head'])
$$;

revoke all on function public.blood_department_id() from public;
revoke all on function public.is_blood_department_member() from public;
revoke all on function public.has_blood_department_role(text[]) from public;
revoke all on function public.can_view_blood_operations() from public;
revoke all on function public.can_manage_blood_donors() from public;
revoke all on function public.can_manage_blood_requests() from public;
revoke all on function public.can_manage_blood_matches() from public;
revoke all on function public.can_verify_blood_donations() from public;
revoke all on function public.can_manage_blood_settings() from public;
grant execute on function public.blood_department_id() to authenticated;
grant execute on function public.is_blood_department_member() to authenticated;
grant execute on function public.has_blood_department_role(text[]) to authenticated;
grant execute on function public.can_view_blood_operations() to authenticated;
grant execute on function public.can_manage_blood_donors() to authenticated;
grant execute on function public.can_manage_blood_requests() to authenticated;
grant execute on function public.can_manage_blood_matches() to authenticated;
grant execute on function public.can_verify_blood_donations() to authenticated;
grant execute on function public.can_manage_blood_settings() to authenticated;

alter table public.blood_support_settings enable row level security;
alter table public.blood_donor_profiles enable row level security;
alter table public.blood_donor_contacts enable row level security;
alter table public.blood_requests enable row level security;
alter table public.blood_request_contacts enable row level security;
alter table public.blood_matches enable row level security;
alter table public.blood_donations enable row level security;
alter table public.blood_donor_status_history enable row level security;
alter table public.blood_request_status_history enable row level security;
alter table public.blood_match_status_history enable row level security;
alter table public.blood_donation_status_history enable row level security;
alter table public.blood_donor_duplicate_reviews enable row level security;

revoke all on table public.blood_support_settings from anon, authenticated;
revoke all on table public.blood_donor_profiles from anon, authenticated;
revoke all on table public.blood_donor_contacts from anon, authenticated;
revoke all on table public.blood_requests from anon, authenticated;
revoke all on table public.blood_request_contacts from anon, authenticated;
revoke all on table public.blood_matches from anon, authenticated;
revoke all on table public.blood_donations from anon, authenticated;
revoke all on table public.blood_donor_status_history from anon, authenticated;
revoke all on table public.blood_request_status_history from anon, authenticated;
revoke all on table public.blood_match_status_history from anon, authenticated;
revoke all on table public.blood_donation_status_history from anon, authenticated;
revoke all on table public.blood_donor_duplicate_reviews from anon, authenticated;

grant select on table public.blood_support_settings to authenticated;
grant select on table public.blood_donor_profiles to authenticated;
grant select on table public.blood_requests to authenticated;
grant select on table public.blood_matches to authenticated;
grant select on table public.blood_donations to authenticated;
grant select on table public.blood_donor_status_history to authenticated;
grant select on table public.blood_request_status_history to authenticated;
grant select on table public.blood_match_status_history to authenticated;
grant select on table public.blood_donation_status_history to authenticated;
grant select on table public.blood_donor_duplicate_reviews to authenticated;

drop policy if exists "Blood admins can read settings" on public.blood_support_settings;
create policy "Blood admins can read settings" on public.blood_support_settings for select to authenticated using (public.can_view_blood_operations());
drop policy if exists "Blood admins can read donor profiles" on public.blood_donor_profiles;
create policy "Blood admins can read donor profiles" on public.blood_donor_profiles for select to authenticated using (public.can_view_blood_operations());
drop policy if exists "Blood admins can read requests" on public.blood_requests;
create policy "Blood admins can read requests" on public.blood_requests for select to authenticated using (public.can_view_blood_operations());
drop policy if exists "Blood admins can read matches" on public.blood_matches;
create policy "Blood admins can read matches" on public.blood_matches for select to authenticated using (public.can_view_blood_operations());
drop policy if exists "Blood admins can read donations" on public.blood_donations;
create policy "Blood admins can read donations" on public.blood_donations for select to authenticated using (public.can_view_blood_operations());
drop policy if exists "Blood admins can read donor histories" on public.blood_donor_status_history;
create policy "Blood admins can read donor histories" on public.blood_donor_status_history for select to authenticated using (public.can_view_blood_operations());
drop policy if exists "Blood admins can read request histories" on public.blood_request_status_history;
create policy "Blood admins can read request histories" on public.blood_request_status_history for select to authenticated using (public.can_view_blood_operations());
drop policy if exists "Blood admins can read match histories" on public.blood_match_status_history;
create policy "Blood admins can read match histories" on public.blood_match_status_history for select to authenticated using (public.can_view_blood_operations());
drop policy if exists "Blood admins can read donation histories" on public.blood_donation_status_history;
create policy "Blood admins can read donation histories" on public.blood_donation_status_history for select to authenticated using (public.can_view_blood_operations());
drop policy if exists "Blood admins can read duplicate reviews" on public.blood_donor_duplicate_reviews;
create policy "Blood admins can read duplicate reviews" on public.blood_donor_duplicate_reviews for select to authenticated using (public.can_view_blood_operations());

create or replace function public.review_blood_donor(p_donor_id uuid, p_new_status text, p_reason text default null)
returns table(donor_profile_id uuid, verification_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_donor public.blood_donor_profiles%rowtype;
begin
  if v_actor is null or not public.can_manage_blood_donors() then raise exception 'Not authorized' using errcode = '42501'; end if;
  select * into v_donor from public.blood_donor_profiles where id = p_donor_id for update;
  if not found then raise exception 'Potential donor not found' using errcode = 'P0002'; end if;
  if p_new_status not in ('under_review', 'verified', 'rejected', 'duplicate_flagged', 'archived') then raise exception 'Invalid donor review status' using errcode = '22023'; end if;
  if p_new_status in ('rejected', 'archived') and nullif(btrim(coalesce(p_reason, '')), '') is null then raise exception 'Reason is required' using errcode = '22023'; end if;
  if v_donor.verification_status = 'archived' then raise exception 'Archived donor cannot be reviewed' using errcode = '22023'; end if;
  if p_new_status = 'under_review' and v_donor.verification_status not in ('pending_review') then raise exception 'Invalid donor transition' using errcode = '22023'; end if;
  if p_new_status in ('verified', 'rejected', 'duplicate_flagged') and v_donor.verification_status not in ('pending_review', 'under_review') then raise exception 'Invalid donor transition' using errcode = '22023'; end if;

  update public.blood_donor_profiles
  set verification_status = p_new_status,
      reviewed_by = v_actor,
      reviewed_at = now(),
      rejection_reason = case when p_new_status = 'rejected' then btrim(p_reason) else null end,
      duplicate_review_required = p_new_status = 'duplicate_flagged',
      archived_at = case when p_new_status = 'archived' then now() else archived_at end
  where id = p_donor_id;

  if p_new_status = 'duplicate_flagged' then
    insert into public.blood_donor_duplicate_reviews (donor_profile_id, possible_duplicate_donor_id, match_reason)
    select p_donor_id, other.donor_profile_id, 'normalized contact match'
    from public.blood_donor_contacts current_contact
    join public.blood_donor_contacts other on other.donor_profile_id <> current_contact.donor_profile_id
      and (
        (current_contact.normalized_phone is not null and current_contact.normalized_phone = other.normalized_phone)
        or (current_contact.normalized_email is not null and current_contact.normalized_email = other.normalized_email)
      )
    where current_contact.donor_profile_id = p_donor_id
    on conflict do nothing;
  end if;

  insert into public.blood_donor_status_history (donor_profile_id, previous_status, new_status, changed_by, reason)
  values (p_donor_id, v_donor.verification_status, p_new_status, v_actor, nullif(btrim(coalesce(p_reason, '')), ''));
  perform public.write_club_audit_log('blood_donor.review', 'blood_donor', p_donor_id, public.blood_department_id(), jsonb_build_object('new_status', p_new_status));
  return query select p_donor_id, p_new_status;
end;
$$;

create or replace function public.change_blood_donor_availability(p_donor_id uuid, p_new_status text, p_reason text default null)
returns table(donor_profile_id uuid, availability_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare v_actor uuid := public.current_volunteer_profile_id();
begin
  if v_actor is null or not public.can_manage_blood_donors() then raise exception 'Not authorized' using errcode = '42501'; end if;
  if p_new_status not in ('unknown', 'available', 'temporarily_unavailable', 'unavailable', 'do_not_contact') then raise exception 'Invalid availability status' using errcode = '22023'; end if;
  update public.blood_donor_profiles set availability_status = p_new_status where id = p_donor_id and archived_at is null;
  if not found then raise exception 'Potential donor not found' using errcode = 'P0002'; end if;
  perform public.write_club_audit_log('blood_donor.availability_change', 'blood_donor', p_donor_id, public.blood_department_id(), jsonb_build_object('new_status', p_new_status));
  return query select p_donor_id, p_new_status;
end;
$$;

create or replace function public.review_blood_request(p_request_id uuid, p_new_status text, p_reason text default null)
returns table(blood_request_id uuid, request_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_request public.blood_requests%rowtype;
begin
  if v_actor is null or not public.can_manage_blood_requests() then raise exception 'Not authorized' using errcode = '42501'; end if;
  select * into v_request from public.blood_requests where id = p_request_id for update;
  if not found then raise exception 'Blood request not found' using errcode = 'P0002'; end if;
  if p_new_status not in ('under_review', 'approved', 'rejected') then raise exception 'Invalid review status' using errcode = '22023'; end if;
  if p_new_status = 'under_review' and v_request.request_status <> 'submitted' then raise exception 'Invalid request transition' using errcode = '22023'; end if;
  if p_new_status in ('approved', 'rejected') and v_request.request_status not in ('submitted', 'under_review') then raise exception 'Invalid request transition' using errcode = '22023'; end if;
  if p_new_status = 'rejected' and nullif(btrim(coalesce(p_reason, '')), '') is null then raise exception 'Reason is required' using errcode = '22023'; end if;
  update public.blood_requests
  set request_status = p_new_status,
      reviewed_by = v_actor,
      reviewed_at = now(),
      rejection_reason = case when p_new_status = 'rejected' then btrim(p_reason) else null end
  where id = p_request_id;
  insert into public.blood_request_status_history (blood_request_id, previous_status, new_status, changed_by, reason)
  values (p_request_id, v_request.request_status, p_new_status, v_actor, nullif(btrim(coalesce(p_reason, '')), ''));
  perform public.write_club_audit_log('blood_request.review', 'blood_request', p_request_id, public.blood_department_id(), jsonb_build_object('new_status', p_new_status));
  return query select p_request_id, p_new_status;
end;
$$;

create or replace function public.change_blood_request_status(p_request_id uuid, p_new_status text, p_reason text default null)
returns table(blood_request_id uuid, request_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare v_actor uuid := public.current_volunteer_profile_id(); v_request public.blood_requests%rowtype;
begin
  if v_actor is null or not public.can_manage_blood_requests() then raise exception 'Not authorized' using errcode = '42501'; end if;
  select * into v_request from public.blood_requests where id = p_request_id for update;
  if not found then raise exception 'Blood request not found' using errcode = 'P0002'; end if;
  if p_new_status in ('cancelled', 'rejected', 'archived') and nullif(btrim(coalesce(p_reason, '')), '') is null then raise exception 'Reason is required' using errcode = '22023'; end if;
  if v_request.request_status in ('rejected', 'cancelled', 'expired', 'archived') and p_new_status <> 'archived' then raise exception 'Terminal request cannot be reopened' using errcode = '22023'; end if;
  if p_new_status = 'fulfilled' and v_request.units_fulfilled < v_request.units_requested then raise exception 'Verified units do not fulfil request' using errcode = '22023'; end if;
  update public.blood_requests
  set request_status = p_new_status,
      cancellation_reason = case when p_new_status = 'cancelled' then btrim(p_reason) else cancellation_reason end,
      archived_at = case when p_new_status = 'archived' then now() else archived_at end
  where id = p_request_id;
  insert into public.blood_request_status_history (blood_request_id, previous_status, new_status, changed_by, reason)
  values (p_request_id, v_request.request_status, p_new_status, v_actor, nullif(btrim(coalesce(p_reason, '')), ''));
  perform public.write_club_audit_log('blood_request.status_change', 'blood_request', p_request_id, public.blood_department_id(), jsonb_build_object('new_status', p_new_status));
  return query select p_request_id, p_new_status;
end;
$$;

create or replace function public.create_blood_match(p_request_id uuid, p_donor_id uuid, p_notes text default null)
returns table(match_id uuid, match_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare v_actor uuid := public.current_volunteer_profile_id(); v_request public.blood_requests%rowtype; v_match public.blood_matches%rowtype;
begin
  if v_actor is null or not public.can_manage_blood_matches() then raise exception 'Not authorized' using errcode = '42501'; end if;
  select * into v_request from public.blood_requests where id = p_request_id for update;
  if not found then raise exception 'Blood request not found' using errcode = 'P0002'; end if;
  if v_request.request_status not in ('approved', 'matching', 'partially_fulfilled') then raise exception 'Request cannot accept new matches' using errcode = '22023'; end if;
  if not exists (select 1 from public.blood_donor_profiles where id = p_donor_id and verification_status = 'verified' and archived_at is null) then raise exception 'Potential donor is not verified for matching workflow' using errcode = '22023'; end if;
  insert into public.blood_matches (blood_request_id, donor_profile_id, match_status, suggested_by, notes)
  values (p_request_id, p_donor_id, 'suggested', v_actor, nullif(btrim(coalesce(p_notes, '')), ''))
  returning * into v_match;
  insert into public.blood_match_status_history (blood_match_id, previous_status, new_status, changed_by, reason)
  values (v_match.id, null, 'suggested', v_actor, 'human-reviewed potential donor suggestion');
  if v_request.request_status = 'approved' then
    update public.blood_requests set request_status = 'matching' where id = p_request_id;
    insert into public.blood_request_status_history (blood_request_id, previous_status, new_status, changed_by, reason)
    values (p_request_id, v_request.request_status, 'matching', v_actor, 'match created');
  end if;
  perform public.write_club_audit_log('blood_match.create', 'blood_match', v_match.id, public.blood_department_id(), jsonb_build_object('request_id', p_request_id, 'donor_profile_id', p_donor_id));
  return query select v_match.id, v_match.match_status;
end;
$$;

create or replace function public.change_blood_match_status(p_match_id uuid, p_new_status text, p_reason text default null)
returns table(match_id uuid, match_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare v_actor uuid := public.current_volunteer_profile_id(); v_match public.blood_matches%rowtype; v_request_status text;
begin
  if v_actor is null or not public.can_manage_blood_matches() then raise exception 'Not authorized' using errcode = '42501'; end if;
  select * into v_match from public.blood_matches where id = p_match_id for update;
  if not found then raise exception 'Blood match not found' using errcode = 'P0002'; end if;
  select request_status into v_request_status from public.blood_requests where id = v_match.blood_request_id;
  if v_request_status in ('fulfilled', 'cancelled', 'rejected', 'expired', 'archived') then raise exception 'Request blocks match transition' using errcode = '22023'; end if;
  if p_new_status not in ('shortlisted', 'approved_for_contact', 'contacted', 'interested', 'declined', 'unavailable', 'confirmed', 'completed', 'cancelled') then raise exception 'Invalid match status' using errcode = '22023'; end if;
  if p_new_status in ('cancelled', 'declined', 'unavailable') and nullif(btrim(coalesce(p_reason, '')), '') is null then raise exception 'Reason is required' using errcode = '22023'; end if;
  update public.blood_matches
  set match_status = p_new_status,
      reviewed_by = case when p_new_status in ('shortlisted', 'approved_for_contact') then v_actor else reviewed_by end,
      contact_authorized_by = case when p_new_status = 'approved_for_contact' then v_actor else contact_authorized_by end,
      contact_authorized_at = case when p_new_status = 'approved_for_contact' then now() else contact_authorized_at end,
      contacted_by = case when p_new_status = 'contacted' then v_actor else contacted_by end,
      contacted_at = case when p_new_status = 'contacted' then now() else contacted_at end,
      donor_response_at = case when p_new_status in ('interested', 'declined', 'unavailable') then now() else donor_response_at end,
      confirmation_at = case when p_new_status = 'confirmed' then now() else confirmation_at end,
      completed_at = case when p_new_status = 'completed' then now() else completed_at end,
      cancellation_reason = case when p_new_status = 'cancelled' then btrim(p_reason) else cancellation_reason end
  where id = p_match_id;
  insert into public.blood_match_status_history (blood_match_id, previous_status, new_status, changed_by, reason)
  values (p_match_id, v_match.match_status, p_new_status, v_actor, nullif(btrim(coalesce(p_reason, '')), ''));
  perform public.write_club_audit_log('blood_match.status_change', 'blood_match', p_match_id, public.blood_department_id(), jsonb_build_object('new_status', p_new_status));
  return query select p_match_id, p_new_status;
end;
$$;

create or replace function public.authorize_blood_match_contact(p_match_id uuid, p_reason text default null)
returns table(match_id uuid, match_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  return query select * from public.change_blood_match_status(p_match_id, 'approved_for_contact', p_reason);
end;
$$;

create or replace function public.get_authorized_blood_match_contacts(p_match_id uuid)
returns table(
  match_id uuid,
  donor_profile_id uuid,
  donor_phone text,
  donor_email text,
  donor_preferred_contact_method text,
  blood_request_id uuid,
  requester_name text,
  requester_phone text,
  requester_email text,
  requester_preferred_contact_method text
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare v_actor uuid := public.current_volunteer_profile_id(); v_match public.blood_matches%rowtype;
begin
  if v_actor is null or not public.can_manage_blood_matches() then raise exception 'Not authorized' using errcode = '42501'; end if;
  select * into v_match from public.blood_matches where id = p_match_id;
  if not found then raise exception 'Blood match not found' using errcode = 'P0002'; end if;
  if v_match.match_status not in ('approved_for_contact', 'contacted', 'interested', 'confirmed', 'completed') or v_match.contact_authorized_at is null then
    raise exception 'Contact is not authorized for this match' using errcode = '42501';
  end if;
  perform public.write_club_audit_log('blood_contact_access.view', 'blood_contact_access', p_match_id, public.blood_department_id(), jsonb_build_object('match_status', v_match.match_status));
  return query
  select
    bm.id,
    bm.donor_profile_id,
    bdc.phone,
    bdc.email,
    bdc.preferred_contact_method,
    bm.blood_request_id,
    brc.requester_name,
    brc.phone,
    brc.email,
    brc.preferred_contact_method
  from public.blood_matches bm
  join public.blood_donor_contacts bdc on bdc.donor_profile_id = bm.donor_profile_id
  join public.blood_request_contacts brc on brc.blood_request_id = bm.blood_request_id
  where bm.id = p_match_id;
end;
$$;

create or replace function public.record_blood_donation(p_request_id uuid, p_donor_id uuid, p_match_id uuid, p_reported_units integer, p_donation_date date default null, p_hospital_reference text default null)
returns table(donation_id uuid, donation_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare v_actor uuid := public.current_volunteer_profile_id(); v_donation public.blood_donations%rowtype;
begin
  if v_actor is null or not public.can_manage_blood_matches() then raise exception 'Not authorized' using errcode = '42501'; end if;
  if p_reported_units <= 0 then raise exception 'Reported units must be positive' using errcode = '22023'; end if;
  insert into public.blood_donations (blood_request_id, donor_profile_id, blood_match_id, reported_units, donation_status, donation_date, hospital_reference, reported_by)
  values (p_request_id, p_donor_id, p_match_id, p_reported_units, 'reported', p_donation_date, nullif(btrim(coalesce(p_hospital_reference, '')), ''), v_actor)
  returning * into v_donation;
  insert into public.blood_donation_status_history (blood_donation_id, previous_status, new_status, changed_by, reason)
  values (v_donation.id, null, 'reported', v_actor, 'donation report recorded');
  perform public.write_club_audit_log('blood_donation.record', 'blood_donation', v_donation.id, public.blood_department_id(), jsonb_build_object('request_id', p_request_id, 'reported_units', p_reported_units));
  return query select v_donation.id, v_donation.donation_status;
end;
$$;

create or replace function public.recalculate_blood_request_fulfilment(p_request_id uuid)
returns table(blood_request_id uuid, units_fulfilled integer, request_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare v_actor uuid := public.current_volunteer_profile_id(); v_request public.blood_requests%rowtype; v_units integer; v_status text;
begin
  if v_actor is null or not (public.can_verify_blood_donations() or public.can_manage_blood_matches()) then raise exception 'Not authorized' using errcode = '42501'; end if;
  select * into v_request from public.blood_requests where id = p_request_id for update;
  if not found then raise exception 'Blood request not found' using errcode = 'P0002'; end if;
  select coalesce(sum(verified_units), 0)::integer into v_units from public.blood_donations where blood_request_id = p_request_id and donation_status = 'verified';
  if v_request.request_status in ('rejected', 'cancelled', 'archived') then
    update public.blood_requests set units_fulfilled = v_units where id = p_request_id;
    return query select p_request_id, v_units, v_request.request_status;
    return;
  end if;
  v_status := case when v_units >= v_request.units_requested then 'fulfilled' when v_units > 0 then 'partially_fulfilled' else v_request.request_status end;
  update public.blood_requests set units_fulfilled = v_units, request_status = v_status where id = p_request_id;
  if v_status <> v_request.request_status then
    insert into public.blood_request_status_history (blood_request_id, previous_status, new_status, changed_by, reason, metadata)
    values (p_request_id, v_request.request_status, v_status, v_actor, 'verified donation fulfilment recalculation', jsonb_build_object('verified_units', v_units));
  end if;
  return query select p_request_id, v_units, v_status;
end;
$$;

create or replace function public.verify_blood_donation(p_donation_id uuid, p_verified_units integer, p_new_status text default 'verified', p_reason text default null)
returns table(donation_id uuid, donation_status text, verified_units integer)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare v_actor uuid := public.current_volunteer_profile_id(); v_donation public.blood_donations%rowtype;
begin
  if v_actor is null or not public.can_verify_blood_donations() then raise exception 'Not authorized' using errcode = '42501'; end if;
  select * into v_donation from public.blood_donations where id = p_donation_id for update;
  if not found then raise exception 'Blood donation not found' using errcode = 'P0002'; end if;
  if p_new_status not in ('verified', 'rejected') then raise exception 'Invalid donation verification status' using errcode = '22023'; end if;
  if p_new_status = 'rejected' and nullif(btrim(coalesce(p_reason, '')), '') is null then raise exception 'Reason is required' using errcode = '22023'; end if;
  if p_verified_units < 0 or p_verified_units > v_donation.reported_units then raise exception 'Verified units must be between zero and reported units' using errcode = '22023'; end if;
  update public.blood_donations
  set donation_status = p_new_status,
      verified_units = case when p_new_status = 'verified' then p_verified_units else 0 end,
      verified_by = v_actor,
      verified_at = now(),
      rejection_reason = case when p_new_status = 'rejected' then btrim(p_reason) else null end
  where id = p_donation_id;
  insert into public.blood_donation_status_history (blood_donation_id, previous_status, new_status, changed_by, reason, metadata)
  values (p_donation_id, v_donation.donation_status, p_new_status, v_actor, nullif(btrim(coalesce(p_reason, '')), ''), jsonb_build_object('verified_units', case when p_new_status = 'verified' then p_verified_units else 0 end));
  perform public.write_club_audit_log('blood_donation.verify', 'blood_donation', p_donation_id, public.blood_department_id(), jsonb_build_object('new_status', p_new_status, 'verified_units', case when p_new_status = 'verified' then p_verified_units else 0 end));
  perform public.recalculate_blood_request_fulfilment(v_donation.blood_request_id);
  return query select p_donation_id, p_new_status, case when p_new_status = 'verified' then p_verified_units else 0 end;
end;
$$;

create or replace function public.archive_blood_donor(p_donor_id uuid, p_reason text)
returns table(donor_profile_id uuid, verification_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  return query select * from public.review_blood_donor(p_donor_id, 'archived', p_reason);
end;
$$;

create or replace function public.archive_blood_request(p_request_id uuid, p_reason text)
returns table(blood_request_id uuid, request_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  return query select * from public.change_blood_request_status(p_request_id, 'archived', p_reason);
end;
$$;

revoke all on function public.review_blood_donor(uuid, text, text) from public;
revoke all on function public.change_blood_donor_availability(uuid, text, text) from public;
revoke all on function public.review_blood_request(uuid, text, text) from public;
revoke all on function public.change_blood_request_status(uuid, text, text) from public;
revoke all on function public.create_blood_match(uuid, uuid, text) from public;
revoke all on function public.change_blood_match_status(uuid, text, text) from public;
revoke all on function public.authorize_blood_match_contact(uuid, text) from public;
revoke all on function public.get_authorized_blood_match_contacts(uuid) from public;
revoke all on function public.record_blood_donation(uuid, uuid, uuid, integer, date, text) from public;
revoke all on function public.verify_blood_donation(uuid, integer, text, text) from public;
revoke all on function public.recalculate_blood_request_fulfilment(uuid) from public;
revoke all on function public.archive_blood_donor(uuid, text) from public;
revoke all on function public.archive_blood_request(uuid, text) from public;
grant execute on function public.review_blood_donor(uuid, text, text) to authenticated;
grant execute on function public.change_blood_donor_availability(uuid, text, text) to authenticated;
grant execute on function public.review_blood_request(uuid, text, text) to authenticated;
grant execute on function public.change_blood_request_status(uuid, text, text) to authenticated;
grant execute on function public.create_blood_match(uuid, uuid, text) to authenticated;
grant execute on function public.change_blood_match_status(uuid, text, text) to authenticated;
grant execute on function public.authorize_blood_match_contact(uuid, text) to authenticated;
grant execute on function public.get_authorized_blood_match_contacts(uuid) to authenticated;
grant execute on function public.record_blood_donation(uuid, uuid, uuid, integer, date, text) to authenticated;
grant execute on function public.verify_blood_donation(uuid, integer, text, text) to authenticated;
grant execute on function public.recalculate_blood_request_fulfilment(uuid) to authenticated;
grant execute on function public.archive_blood_donor(uuid, text) to authenticated;
grant execute on function public.archive_blood_request(uuid, text) to authenticated;
