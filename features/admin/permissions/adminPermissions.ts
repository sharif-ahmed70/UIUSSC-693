import type { AdminPermissions } from '@/features/admin/types'

export function canAccessAdmin(permissions: AdminPermissions){
  return Object.values(permissions).some(Boolean)
}

export function adminNavigation(permissions: AdminPermissions){
  return [
    { href: '/admin', label: 'Dashboard', enabled: canAccessAdmin(permissions) },
    { href: '/admin/membership-applications', label: 'Applications', enabled: permissions.canReviewMembershipApplications },
    { href: '/admin/volunteers', label: 'Volunteers', enabled: permissions.canManageVolunteers },
    { href: '/admin/department-memberships', label: 'Department Requests', enabled: permissions.canManageVolunteers },
    { href: '/admin/club-positions', label: 'Club Positions', enabled: permissions.canManageVolunteers },
    { href: '/admin/departments', label: 'Departments', enabled: permissions.canManageDepartments },
    { href: '/admin/platform-roles', label: 'Platform Roles', enabled: permissions.canManagePlatformRoles },
    { href: '/admin/audit-logs', label: 'Audit Logs', enabled: permissions.canViewAuditLogs },
  ].filter((item) => item.enabled)
}
