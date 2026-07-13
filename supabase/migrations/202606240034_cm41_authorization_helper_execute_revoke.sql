-- CM-4.1: keep internal authorization helper RPCs unavailable to anonymous users.

revoke all on function public.has_effective_permission(text, text, uuid) from anon, public;
revoke all on function public.get_action_authorization(text, text, uuid) from anon, public;
revoke all on function public.permission_scope_matches(text, text, uuid, uuid, uuid) from anon, public;

grant execute on function public.has_effective_permission(text, text, uuid) to authenticated;
grant execute on function public.get_action_authorization(text, text, uuid) to authenticated;
grant execute on function public.permission_scope_matches(text, text, uuid, uuid, uuid) to authenticated;

select public.write_club_audit_log(
  'access_governance.cm41_authorization_helpers_hardened',
  'permission_policy',
  null,
  null,
  jsonb_build_object(
    'phase', 'CM-4.1',
    'reason', 'Internal authorization helper functions are executable only by authenticated users.'
  )
);
