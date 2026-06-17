-- UIUSSC Phase 2A initial Supabase schema
-- Version: 202606170001

-- ==================================================
-- 1. Extensions
-- ==================================================

create extension if not exists pgcrypto;

-- ==================================================
-- 2. Tables
-- ==================================================

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text not null,
  description text not null,
  category text not null,
  event_date date not null,
  start_time time,
  end_time time,
  location text not null,
  banner_url text,
  volunteer_requirements text,
  capacity integer,
  registration_open boolean not null default false,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_category_check check (category in ('Blood Donation', 'Donation Drive', 'Campaign', 'Orientation', 'Workshop', 'Other')),
  constraint events_status_check check (status in ('draft', 'published', 'completed', 'cancelled', 'archived')),
  constraint events_capacity_check check (capacity is null or capacity > 0)
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null,
  content text not null,
  category text not null,
  priority text not null default 'normal',
  is_pinned boolean not null default false,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notices_priority_check check (priority in ('normal', 'important', 'urgent')),
  constraint notices_status_check check (status in ('draft', 'published', 'archived'))
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  caption text,
  image_url text not null,
  category text not null,
  event_id uuid references public.events(id) on delete set null,
  display_order integer not null default 0,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gallery_items_status_check check (status in ('draft', 'published', 'archived')),
  constraint gallery_items_display_order_check check (display_order >= 0)
);

create table if not exists public.membership_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  student_id text not null,
  department text not null,
  trimester text not null,
  email text not null,
  phone text not null,
  blood_group text not null,
  interested_department text not null,
  skills text,
  motivation text not null,
  status text not null default 'pending',
  admin_notes text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint membership_applications_status_check check (status in ('pending', 'approved', 'rejected', 'waitlisted', 'withdrawn'))
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'unread',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_messages_status_check check (status in ('unread', 'read', 'replied', 'archived'))
);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  full_name text not null,
  student_id text,
  email text not null,
  phone text not null,
  blood_group text,
  motivation text,
  status text not null default 'registered',
  registered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_registrations_status_check check (status in ('registered', 'selected', 'waitlisted', 'attended', 'cancelled', 'rejected'))
);

-- ==================================================
-- 3. Updated-at trigger
-- ==================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists set_notices_updated_at on public.notices;
create trigger set_notices_updated_at
before update on public.notices
for each row execute function public.set_updated_at();

drop trigger if exists set_gallery_items_updated_at on public.gallery_items;
create trigger set_gallery_items_updated_at
before update on public.gallery_items
for each row execute function public.set_updated_at();

drop trigger if exists set_membership_applications_updated_at on public.membership_applications;
create trigger set_membership_applications_updated_at
before update on public.membership_applications
for each row execute function public.set_updated_at();

drop trigger if exists set_contact_messages_updated_at on public.contact_messages;
create trigger set_contact_messages_updated_at
before update on public.contact_messages
for each row execute function public.set_updated_at();

drop trigger if exists set_event_registrations_updated_at on public.event_registrations;
create trigger set_event_registrations_updated_at
before update on public.event_registrations
for each row execute function public.set_updated_at();

-- ==================================================
-- 4. Indexes
-- ==================================================

create index if not exists events_status_idx on public.events (status);
create index if not exists events_category_idx on public.events (category);
create index if not exists events_event_date_idx on public.events (event_date);
create index if not exists events_published_at_idx on public.events (published_at);

create index if not exists notices_status_idx on public.notices (status);
create index if not exists notices_priority_idx on public.notices (priority);
create index if not exists notices_published_at_idx on public.notices (published_at);
create index if not exists notices_is_pinned_idx on public.notices (is_pinned);

create index if not exists gallery_items_status_idx on public.gallery_items (status);
create index if not exists gallery_items_category_idx on public.gallery_items (category);
create index if not exists gallery_items_event_id_idx on public.gallery_items (event_id);
create index if not exists gallery_items_display_order_idx on public.gallery_items (display_order);

create index if not exists membership_applications_status_idx on public.membership_applications (status);
create index if not exists membership_applications_submitted_at_idx on public.membership_applications (submitted_at);
create index if not exists membership_applications_normalized_student_id_idx on public.membership_applications (lower(trim(student_id)));
create unique index if not exists membership_applications_one_pending_student_id_idx
on public.membership_applications (lower(trim(student_id)))
where status = 'pending';

create index if not exists contact_messages_status_idx on public.contact_messages (status);
create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at);

create index if not exists event_registrations_event_id_idx on public.event_registrations (event_id);
create index if not exists event_registrations_status_idx on public.event_registrations (status);
create index if not exists event_registrations_registered_at_idx on public.event_registrations (registered_at);
create unique index if not exists event_registrations_one_email_per_event_idx
on public.event_registrations (event_id, lower(trim(email)));
create unique index if not exists event_registrations_one_student_id_per_event_idx
on public.event_registrations (event_id, lower(trim(student_id)))
where student_id is not null and btrim(student_id) <> '';

-- ==================================================
-- 5. Grants
-- ==================================================

revoke all on table public.events from anon, authenticated;
revoke all on table public.notices from anon, authenticated;
revoke all on table public.gallery_items from anon, authenticated;
revoke all on table public.membership_applications from anon, authenticated;
revoke all on table public.contact_messages from anon, authenticated;
revoke all on table public.event_registrations from anon, authenticated;

revoke all privileges (
  id,
  full_name,
  student_id,
  department,
  trimester,
  email,
  phone,
  blood_group,
  interested_department,
  skills,
  motivation,
  status,
  admin_notes,
  submitted_at,
  reviewed_at,
  updated_at
) on public.membership_applications from anon, authenticated;

revoke all privileges (
  id,
  name,
  email,
  subject,
  message,
  status,
  created_at,
  updated_at
) on public.contact_messages from anon, authenticated;

revoke all privileges (
  id,
  event_id,
  full_name,
  student_id,
  email,
  phone,
  blood_group,
  motivation,
  status,
  registered_at,
  updated_at
) on public.event_registrations from anon, authenticated;

grant select on table public.events to anon, authenticated;
grant select on table public.notices to anon, authenticated;
grant select on table public.gallery_items to anon, authenticated;
grant insert (
  full_name,
  student_id,
  department,
  trimester,
  email,
  phone,
  blood_group,
  interested_department,
  skills,
  motivation
) on public.membership_applications to anon, authenticated;

grant insert (
  name,
  email,
  subject,
  message
) on public.contact_messages to anon, authenticated;

grant insert (
  event_id,
  full_name,
  student_id,
  email,
  phone,
  blood_group,
  motivation
) on public.event_registrations to anon, authenticated;

-- ==================================================
-- 6. Row Level Security
-- ==================================================

alter table public.events enable row level security;
alter table public.notices enable row level security;
alter table public.gallery_items enable row level security;
alter table public.membership_applications enable row level security;
alter table public.contact_messages enable row level security;
alter table public.event_registrations enable row level security;

drop policy if exists "Public can read published events" on public.events;
create policy "Public can read published events"
on public.events
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Public can read published notices" on public.notices;
create policy "Public can read published notices"
on public.notices
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Public can read published gallery items" on public.gallery_items;
create policy "Public can read published gallery items"
on public.gallery_items
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Public can submit pending membership applications" on public.membership_applications;
create policy "Public can submit pending membership applications"
on public.membership_applications
for insert
to anon, authenticated
with check (
  status = 'pending'
  and admin_notes is null
  and reviewed_at is null
);

drop policy if exists "Public can submit unread contact messages" on public.contact_messages;
create policy "Public can submit unread contact messages"
on public.contact_messages
for insert
to anon, authenticated
with check (status = 'unread');

drop policy if exists "Public can register for open published events" on public.event_registrations;
create policy "Public can register for open published events"
on public.event_registrations
for insert
to anon, authenticated
with check (
  status = 'registered'
  and exists (
    select 1
    from public.events
    where events.id = event_registrations.event_id
      and events.status = 'published'
      and events.registration_open = true
  )
);
