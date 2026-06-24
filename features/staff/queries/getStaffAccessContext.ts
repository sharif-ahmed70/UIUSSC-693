import 'server-only'

import { getDepartmentDestination } from '@/features/departments/getDepartmentDestination'
import type {
  AccountStatus,
  DepartmentRole,
  MembershipStatus,
  OnboardingStatus,
  PlatformRole,
  StaffAccessContext,
  StaffMembership,
} from '@/features/staff/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type ProfileRow = {
  id: string
  auth_user_id: string
  full_name: string
  student_id: string | null
  email: string
  phone: string | null
  academic_department: string | null
  trimester: string | null
  blood_group: string | null
  account_status: string
  onboarding_status: string
  primary_department_id: string | null
}

type MembershipRow = {
  id: string
  volunteer_profile_id: string
  department_id: string
  department_role: string
  membership_status: string
  is_primary: boolean
  requested_at: string
  approved_at: string | null
}

type DepartmentRow = {
  id: string
  name: string
  slug: string
  short_description: string | null
}

function emptyContext(): StaffAccessContext {
  return {
    userId: null,
    email: null,
    profile: null,
    approvedMemberships: [],
    pendingMemberships: [],
    platformRoles: [],
    primaryMembership: null,
    recommendedDestination: '/login',
  }
}

function toMembership(row: MembershipRow, department: DepartmentRow): StaffMembership {
  return {
    id: row.id,
    status: row.membership_status as MembershipStatus,
    role: row.department_role as DepartmentRole,
    isPrimary: row.is_primary,
    requestedAt: row.requested_at,
    approvedAt: row.approved_at,
    department: {
      id: department.id,
      name: department.name,
      slug: department.slug,
      shortDescription: department.short_description,
    },
  }
}

export async function getStaffAccessContext(): Promise<StaffAccessContext> {
  const supabase = await createServerSupabaseClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return emptyContext()
  }

  const user = userData.user
  const { data: profile } = await supabase
    .from('volunteer_profiles')
    .select('id, auth_user_id, full_name, student_id, email, phone, academic_department, trimester, blood_group, account_status, onboarding_status, primary_department_id')
    .eq('auth_user_id', user.id)
    .maybeSingle<ProfileRow>()

  if (!profile) {
    return {
      ...emptyContext(),
      userId: user.id,
      email: user.email ?? null,
      recommendedDestination: '/staff/onboarding',
    }
  }

  const [{ data: memberships }, { data: roles }] = await Promise.all([
    supabase
      .from('volunteer_department_memberships')
      .select('id, volunteer_profile_id, department_id, department_role, membership_status, is_primary, requested_at, approved_at')
      .eq('volunteer_profile_id', profile.id),
    supabase
      .from('volunteer_platform_roles')
      .select('role')
      .eq('volunteer_profile_id', profile.id)
      .eq('status', 'active'),
  ])

  const membershipRows = (memberships ?? []) as MembershipRow[]
  const departmentIds = Array.from(new Set(membershipRows.map((membership) => membership.department_id)))
  const { data: departments } = departmentIds.length
    ? await supabase
        .from('club_departments')
        .select('id, name, slug, short_description')
        .in('id', departmentIds)
    : { data: [] }

  const departmentById = new Map((departments as DepartmentRow[] | null ?? []).map((department) => [department.id, department]))
  const safeMemberships = membershipRows
    .map((membership) => {
      const department = departmentById.get(membership.department_id)
      return department ? toMembership(membership, department) : null
    })
    .filter((membership): membership is StaffMembership => membership !== null)

  const approvedMemberships = safeMemberships.filter((membership) => membership.status === 'approved')
  const pendingMemberships = safeMemberships.filter((membership) => membership.status === 'requested' || membership.status === 'under_review')
  const primaryMembership =
    approvedMemberships.find((membership) => membership.isPrimary) ??
    approvedMemberships.find((membership) => membership.department.id === profile.primary_department_id) ??
    approvedMemberships[0] ??
    null
  const platformRoles = ((roles ?? []) as { role: string }[]).map((role) => role.role as PlatformRole)

  let recommendedDestination = '/staff/onboarding'

  if (profile.onboarding_status === 'submitted' || profile.onboarding_status === 'under_review') {
    recommendedDestination = '/staff/pending'
  } else if (
    profile.account_status === 'rejected' ||
    profile.account_status === 'suspended' ||
    profile.account_status === 'archived' ||
    profile.onboarding_status === 'rejected'
  ) {
    recommendedDestination = '/staff/access-status'
  } else if (platformRoles.includes('club_admin') || platformRoles.includes('super_admin')) {
    recommendedDestination = '/staff'
  } else if (profile.account_status === 'approved' && profile.onboarding_status === 'approved' && approvedMemberships.length === 1) {
    recommendedDestination = getDepartmentDestination(approvedMemberships[0].department.slug)
  } else if (profile.account_status === 'approved' && profile.onboarding_status === 'approved' && approvedMemberships.length > 1) {
    recommendedDestination = '/staff'
  } else if (profile.account_status === 'approved' && approvedMemberships.length === 0) {
    recommendedDestination = '/staff/no-access'
  }

  return {
    userId: user.id,
    email: user.email ?? profile.email,
    profile: {
      id: profile.id,
      fullName: profile.full_name,
      studentId: profile.student_id,
      email: profile.email,
      phone: profile.phone,
      academicDepartment: profile.academic_department,
      trimester: profile.trimester,
      bloodGroup: profile.blood_group,
      accountStatus: profile.account_status as AccountStatus,
      onboardingStatus: profile.onboarding_status as OnboardingStatus,
      primaryDepartmentId: profile.primary_department_id,
    },
    approvedMemberships,
    pendingMemberships,
    platformRoles,
    primaryMembership,
    recommendedDestination,
  }
}
