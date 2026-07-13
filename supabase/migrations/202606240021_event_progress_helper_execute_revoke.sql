-- CM-5C2.2 security hardening: keep reporting helpers internal to security-definer RPCs.

revoke all on function public.cm5c2_filter_matches(text, date, uuid, boolean, boolean, boolean, boolean, text, text, uuid, text) from authenticated;
revoke all on function public.cm5c2_visible_assignments() from authenticated;
revoke all on function public.cm5c2_visible_tasks() from authenticated;

revoke all on function public.cm5c2_filter_matches(text, date, uuid, boolean, boolean, boolean, boolean, text, text, uuid, text) from anon, public;
revoke all on function public.cm5c2_visible_assignments() from anon, public;
revoke all on function public.cm5c2_visible_tasks() from anon, public;
