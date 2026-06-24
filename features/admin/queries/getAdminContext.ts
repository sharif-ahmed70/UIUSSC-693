import 'server-only'

import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import type { AdminContext } from '@/features/admin/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getAdminContext(): Promise<AdminContext>{
  const staff = await getStaffAccessContext()

  if (!staff.userId || !staff.profile || staff.profile.accountStatus !== 'approved' || staff.profile.onboardingStatus !== 'approved') {
    return {
      staff,
      permissions: {
        canReviewMembershipApplications: false,
        canManageVolunteers: false,
        canManageDepartments: false,
        canManagePlatformRoles: false,
        canViewAuditLogs: false,
        canViewAccessControl: false,
        canManageAccessGrants: false,
        canReviewApprovalRequests: false,
        canCreateStaffInvitations: false,
      },
      isAdmin: false,
    }
  }

  const supabase = await createServerSupabaseClient()
  const [
    reviewApplications,
    manageVolunteers,
    manageDepartments,
    managePlatformRoles,
    viewAuditLogs,
    viewAccessControl,
    manageAccessGrants,
    reviewApprovalRequests,
    createStaffInvitations,
  ] = await Promise.all([
    supabase.rpc('can_review_membership_applications'),
    supabase.rpc('can_manage_volunteers'),
    supabase.rpc('can_manage_departments'),
    supabase.rpc('can_manage_platform_roles'),
    supabase.rpc('can_view_audit_logs'),
    supabase.rpc('has_effective_permission', { permission_key: 'access_grants.view', scope_type: 'global' }),
    supabase.rpc('has_effective_permission', { permission_key: 'access_grants.manage', scope_type: 'global' }),
    supabase.rpc('has_effective_permission', { permission_key: 'approval_requests.review', scope_type: 'global' }),
    supabase.rpc('has_effective_permission', { permission_key: 'staff_invitations.create', scope_type: 'global' }),
  ])

  const permissions = {
    canReviewMembershipApplications: Boolean(reviewApplications.data),
    canManageVolunteers: Boolean(manageVolunteers.data),
    canManageDepartments: Boolean(manageDepartments.data),
    canManagePlatformRoles: Boolean(managePlatformRoles.data),
    canViewAuditLogs: Boolean(viewAuditLogs.data),
    canViewAccessControl: Boolean(viewAccessControl.data),
    canManageAccessGrants: Boolean(manageAccessGrants.data),
    canReviewApprovalRequests: Boolean(reviewApprovalRequests.data),
    canCreateStaffInvitations: Boolean(createStaffInvitations.data),
  }

  return {
    staff,
    permissions,
    isAdmin: Object.values(permissions).some(Boolean),
  }
}
