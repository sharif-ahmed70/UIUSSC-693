import { getDepartmentDestination } from '@/features/departments/getDepartmentDestination'
import type { StaffAccessContext } from '@/features/staff/types'

export function resolveStaffDestination(access: StaffAccessContext, requestedPath = '/staff'){
  if (!access.userId) {
    return `/login?next=${encodeURIComponent(requestedPath)}`
  }

  if (!access.profile || access.profile.onboardingStatus === 'profile_incomplete') {
    return '/staff/onboarding'
  }

  if (access.profile.onboardingStatus === 'submitted' || access.profile.onboardingStatus === 'under_review') {
    return '/staff/pending'
  }

  if (
    access.profile.accountStatus === 'rejected' ||
    access.profile.accountStatus === 'suspended' ||
    access.profile.accountStatus === 'archived' ||
    access.profile.onboardingStatus === 'rejected'
  ) {
    return '/staff/access-status'
  }

  const isPlatformAdmin = access.platformRoles.includes('club_admin') || access.platformRoles.includes('super_admin')

  if (isPlatformAdmin) {
    return requestedPath.startsWith('/staff') ? requestedPath : '/staff'
  }

  if (access.profile.accountStatus !== 'approved' || access.profile.onboardingStatus !== 'approved') {
    return '/staff/pending'
  }

  if (access.approvedMemberships.length === 0) {
    return '/staff/no-access'
  }

  if (access.approvedMemberships.length === 1 && requestedPath === '/staff') {
    return getDepartmentDestination(access.approvedMemberships[0].department.slug)
  }

  return requestedPath.startsWith('/staff') ? requestedPath : '/staff'
}
