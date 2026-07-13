-- NC-1 hardening: notification creation remains internal to workflow RPCs.

revoke all on function public.ensure_notification_preferences(uuid) from anon, authenticated, public;
revoke all on function public.notification_category_enabled(uuid, text) from anon, authenticated, public;
revoke all on function public.send_notification(uuid, text, text, text, text, text, uuid, text) from anon, authenticated, public;

grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.mark_all_notifications_read() to authenticated;
grant execute on function public.update_notification_preferences(boolean, boolean, boolean, boolean, boolean, boolean) to authenticated;
