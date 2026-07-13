-- NC-1: Notification and Communication foundation.
-- In-app notifications are user-owned and future-ready for email/push delivery.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_profile_id uuid not null references public.volunteer_profiles(id) on delete cascade,
  title text not null,
  message text not null,
  category text not null,
  priority text not null default 'NORMAL',
  related_module text,
  related_record_id uuid,
  action_url text,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_category_check check (category in ('EVENT', 'TASK', 'BLOOD', 'COMMITTEE', 'APPROVAL', 'SYSTEM')),
  constraint notifications_priority_check check (priority in ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  constraint notifications_title_check check (length(btrim(title)) between 2 and 120),
  constraint notifications_message_check check (length(btrim(message)) between 2 and 500),
  constraint notifications_read_consistency_check check ((is_read = false and read_at is null) or (is_read = true and read_at is not null))
);

create index if not exists notifications_recipient_created_idx on public.notifications (recipient_profile_id, created_at desc);
create index if not exists notifications_recipient_unread_idx on public.notifications (recipient_profile_id, created_at desc) where is_read = false;

create table if not exists public.notification_preferences (
  volunteer_profile_id uuid primary key references public.volunteer_profiles(id) on delete cascade,
  event_updates_enabled boolean not null default true,
  task_updates_enabled boolean not null default true,
  blood_alerts_enabled boolean not null default true,
  committee_updates_enabled boolean not null default true,
  approval_updates_enabled boolean not null default true,
  system_updates_enabled boolean not null default true,
  email_enabled boolean not null default false,
  push_enabled boolean not null default false,
  sms_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_notification_preferences_updated_at on public.notification_preferences;
create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

create or replace function public.ensure_notification_preferences(p_profile_id uuid)
returns public.notification_preferences
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_preferences public.notification_preferences%rowtype;
begin
  insert into public.notification_preferences (volunteer_profile_id)
  values (p_profile_id)
  on conflict (volunteer_profile_id) do nothing;

  select * into v_preferences
  from public.notification_preferences
  where volunteer_profile_id = p_profile_id;

  return v_preferences;
end;
$$;

create or replace function public.notification_category_enabled(p_profile_id uuid, p_category text)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_preferences public.notification_preferences%rowtype;
begin
  select * into v_preferences
  from public.ensure_notification_preferences(p_profile_id);

  return case p_category
    when 'EVENT' then v_preferences.event_updates_enabled
    when 'TASK' then v_preferences.task_updates_enabled
    when 'BLOOD' then v_preferences.blood_alerts_enabled
    when 'COMMITTEE' then v_preferences.committee_updates_enabled
    when 'APPROVAL' then v_preferences.approval_updates_enabled
    when 'SYSTEM' then v_preferences.system_updates_enabled
    else false
  end;
end;
$$;

create or replace function public.send_notification(
  p_recipient_profile_id uuid,
  p_title text,
  p_message text,
  p_category text,
  p_priority text default 'NORMAL',
  p_related_module text default null,
  p_related_record_id uuid default null,
  p_action_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_notification_id uuid;
  v_category text := upper(btrim(coalesce(p_category, 'SYSTEM')));
  v_priority text := upper(btrim(coalesce(p_priority, 'NORMAL')));
begin
  if p_recipient_profile_id is null then
    return null;
  end if;

  if not exists (
    select 1
    from public.volunteer_profiles
    where id = p_recipient_profile_id
      and account_status = 'approved'
      and archived_at is null
  ) then
    return null;
  end if;

  if v_category not in ('EVENT', 'TASK', 'BLOOD', 'COMMITTEE', 'APPROVAL', 'SYSTEM') then
    v_category := 'SYSTEM';
  end if;

  if v_priority not in ('LOW', 'NORMAL', 'HIGH', 'URGENT') then
    v_priority := 'NORMAL';
  end if;

  if not public.notification_category_enabled(p_recipient_profile_id, v_category) then
    return null;
  end if;

  insert into public.notifications (
    recipient_profile_id,
    title,
    message,
    category,
    priority,
    related_module,
    related_record_id,
    action_url
  )
  values (
    p_recipient_profile_id,
    btrim(p_title),
    btrim(p_message),
    v_category,
    v_priority,
    nullif(btrim(coalesce(p_related_module, '')), ''),
    p_related_record_id,
    nullif(btrim(coalesce(p_action_url, '')), '')
  )
  returning id into v_notification_id;

  return v_notification_id;
end;
$$;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns table(notification_id uuid, is_read boolean)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  update public.notifications
  set is_read = true,
      read_at = coalesce(read_at, now())
  where id = p_notification_id
    and recipient_profile_id = v_actor
  returning id, notifications.is_read into notification_id, is_read;

  if notification_id is null then
    raise exception 'Notification not found' using errcode = 'P0002';
  end if;

  return next;
end;
$$;

create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
  v_count integer := 0;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  update public.notifications
  set is_read = true,
      read_at = coalesce(read_at, now())
  where recipient_profile_id = v_actor
    and is_read = false;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.update_notification_preferences(
  p_event_updates_enabled boolean,
  p_task_updates_enabled boolean,
  p_blood_alerts_enabled boolean,
  p_committee_updates_enabled boolean,
  p_approval_updates_enabled boolean,
  p_system_updates_enabled boolean
)
returns table(volunteer_profile_id uuid)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_actor uuid := public.current_volunteer_profile_id();
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  insert into public.notification_preferences (
    volunteer_profile_id,
    event_updates_enabled,
    task_updates_enabled,
    blood_alerts_enabled,
    committee_updates_enabled,
    approval_updates_enabled,
    system_updates_enabled
  )
  values (
    v_actor,
    coalesce(p_event_updates_enabled, true),
    coalesce(p_task_updates_enabled, true),
    coalesce(p_blood_alerts_enabled, true),
    coalesce(p_committee_updates_enabled, true),
    coalesce(p_approval_updates_enabled, true),
    coalesce(p_system_updates_enabled, true)
  )
  on conflict (volunteer_profile_id) do update set
    event_updates_enabled = excluded.event_updates_enabled,
    task_updates_enabled = excluded.task_updates_enabled,
    blood_alerts_enabled = excluded.blood_alerts_enabled,
    committee_updates_enabled = excluded.committee_updates_enabled,
    approval_updates_enabled = excluded.approval_updates_enabled,
    system_updates_enabled = excluded.system_updates_enabled;

  return query select v_actor;
end;
$$;

alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

revoke all on table public.notifications from anon, authenticated;
revoke all on table public.notification_preferences from anon, authenticated;

grant select on table public.notifications to authenticated;
grant select, update on table public.notification_preferences to authenticated;

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications" on public.notifications
for select to authenticated
using (recipient_profile_id = public.current_volunteer_profile_id());

drop policy if exists "Users can read own notification preferences" on public.notification_preferences;
create policy "Users can read own notification preferences" on public.notification_preferences
for select to authenticated
using (volunteer_profile_id = public.current_volunteer_profile_id());

drop policy if exists "Users can update own notification preferences" on public.notification_preferences;
create policy "Users can update own notification preferences" on public.notification_preferences
for update to authenticated
using (volunteer_profile_id = public.current_volunteer_profile_id())
with check (volunteer_profile_id = public.current_volunteer_profile_id());

revoke all on function public.ensure_notification_preferences(uuid) from anon, public;
revoke all on function public.notification_category_enabled(uuid, text) from anon, public;
revoke all on function public.send_notification(uuid, text, text, text, text, text, uuid, text) from anon, public;
revoke all on function public.mark_notification_read(uuid) from anon, public;
revoke all on function public.mark_all_notifications_read() from anon, public;
revoke all on function public.update_notification_preferences(boolean, boolean, boolean, boolean, boolean, boolean) from anon, public;

grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.mark_all_notifications_read() to authenticated;
grant execute on function public.update_notification_preferences(boolean, boolean, boolean, boolean, boolean, boolean) to authenticated;
