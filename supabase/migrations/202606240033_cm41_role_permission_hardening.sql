-- CM-4.1: role permission acceptance hardening.
-- Club positions do not carry a department id, so department-scoped authority must
-- come from department membership policies rather than standalone position rows.

update public.club_position_permission_policies policy
set
  is_active = false,
  updated_at = now()
from public.system_permissions permission
where policy.permission_id = permission.id
  and policy.is_active = true
  and policy.club_position_slug = 'head-blood'
  and policy.scope_rule = 'own_department'
  and permission.permission_key in (
    'blood.view',
    'blood.manage_requests',
    'blood.manage_donors',
    'blood.manage_matches',
    'blood.assign_executives',
    'blood.verify_donation'
  );

update public.platform_role_permission_policies policy
set
  is_active = false,
  updated_at = now()
from public.system_permissions permission
where policy.permission_id = permission.id
  and policy.is_active = true
  and policy.platform_role <> 'super_admin'
  and permission.permission_key in (
    'user.manage_roles',
    'platform_roles.assign',
    'platform_roles.revoke'
  );

select public.write_club_audit_log(
  'access_governance.cm41_position_scope_hardened',
  'permission_policy',
  null,
  public.blood_department_id(),
  jsonb_build_object(
    'phase', 'CM-4.1',
    'reason', 'Department-scoped Blood authority is enforced through Blood Department membership, and advanced website role changes remain Super Admin controlled.'
  )
);
