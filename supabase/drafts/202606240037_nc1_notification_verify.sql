-- NC-1 notification foundation verification.

do $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from information_schema.tables
  where table_schema = 'public'
    and table_name in ('notifications', 'notification_preferences');

  if v_count <> 2 then
    raise exception 'Notification tables are missing. Found %', v_count;
  end if;

  select count(*) into v_count
  from pg_proc procedure
  join pg_namespace namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public'
    and procedure.proname in (
      'send_notification',
      'mark_notification_read',
      'mark_all_notifications_read',
      'update_notification_preferences'
    );

  if v_count <> 4 then
    raise exception 'Notification RPCs are missing. Found %', v_count;
  end if;

  if has_table_privilege('anon', 'public.notifications', 'SELECT') then
    raise exception 'Anon must not read notifications.';
  end if;

  if has_table_privilege('authenticated', 'public.notifications', 'INSERT') then
    raise exception 'Authenticated clients must not directly insert notifications.';
  end if;

  if has_function_privilege('anon', 'public.send_notification(uuid,text,text,text,text,text,uuid,text)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.send_notification(uuid,text,text,text,text,text,uuid,text)', 'EXECUTE') then
    raise exception 'Clients must not directly execute send_notification.';
  end if;

  if not has_function_privilege('authenticated', 'public.mark_notification_read(uuid)', 'EXECUTE') then
    raise exception 'Authenticated users must be able to mark own notifications read.';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'Users can read own notifications'
  ) then
    raise exception 'Own-notification RLS policy is missing.';
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'notifications_recipient_unread_idx'
  ) then
    raise exception 'Unread notification index is missing.';
  end if;
end;
$$;

select 'nc1_notification_foundation_verified' as result, now() as verified_at;
