import 'server-only'

import { notFound, redirect } from 'next/navigation'
import { getDepartmentSlugForPath } from '@/features/departments/getDepartmentDestination'
import type { DepartmentRole, PlatformRole, StaffAccessContext } from '@/features/staff/types'

export function requireVolunteerProfile(access: StaffAccessContext){
  if (!access.profile) {
    redirect('/staff/onboarding')
  }

  return access.profile
}

export function requireApprovedVolunteer(access: StaffAccessContext){
  const profile = requireVolunteerProfile(access)

  if (profile.accountStatus !== 'approved' || profile.onboardingStatus !== 'approved') {
    redirect(access.recommendedDestination)
  }

  return profile
}

export function hasPlatformRole(access: StaffAccessContext, roles: PlatformRole[]){
  return access.platformRoles.some((role) => roles.includes(role))
}

export function hasClubPosition(access: StaffAccessContext, slugs: string[]){
  return access.clubPositions.some((position) => slugs.includes(position.position.slug))
}

export function hasOperationalOversight(access: StaffAccessContext){
  return hasPlatformRole(access, ['club_admin', 'super_admin']) || hasClubPosition(access, ['president', 'vice-president', 'general-secretary'])
}

export function canAccessDepartment(access: StaffAccessContext, departmentSlug: string){
  if (hasOperationalOversight(access)) {
    return true
  }

  return access.approvedMemberships.some((membership) => membership.department.slug === departmentSlug)
}

export function requireDepartmentMembership(access: StaffAccessContext, departmentSlug: string){
  requireApprovedVolunteer(access)

  const membership = access.approvedMemberships.find((item) => item.department.slug === departmentSlug)

  if (!membership && !hasOperationalOversight(access)) {
    notFound()
  }

  return membership ?? null
}

export function requireDepartmentRole(access: StaffAccessContext, departmentSlug: string, roles: DepartmentRole[]){
  const membership = requireDepartmentMembership(access, departmentSlug)

  if (membership && !roles.includes(membership.role)) {
    notFound()
  }

  return membership
}

export function requirePlatformRole(access: StaffAccessContext, roles: PlatformRole[]){
  if (!hasPlatformRole(access, roles)) {
    notFound()
  }
}

export function requirePathDepartmentAccess(access: StaffAccessContext, pathname: string){
  const slug = getDepartmentSlugForPath(pathname)

  if (slug) {
    requireDepartmentMembership(access, slug)
  }
}
