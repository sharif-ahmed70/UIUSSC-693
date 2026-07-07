import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type {
  AccessControlSummary,
  AccessOverrideSummary,
  AccessReviewUser,
  AccessUserDetail,
  AccessUserSummary,
  OfficialPermissionMatrix,
  PermissionPolicySummary,
  SystemPermission,
} from './types'

type ProfileRow = {
  id: string
  full_name: string
  email: string
  account_status: string
  onboarding_status: string
}

type ClubPositionAssignmentRow = {
  volunteer_profile_id: string
  club_positions: { name: string | null; slug: string | null } | null
}

type PlatformRoleRow = {
  volunteer_profile_id: string
  role: string
}

type DepartmentMembershipRow = {
  volunteer_profile_id: string
  department_role: string
  club_departments: { name: string | null; slug: string | null } | null
}

function summarizeUsers(
  profiles: ProfileRow[],
  positions: ClubPositionAssignmentRow[],
  roles: PlatformRoleRow[],
  memberships: DepartmentMembershipRow[],
): AccessUserSummary[]{
  const positionsByProfile = new Map<string, string[]>()
  const positionSlugsByProfile = new Map<string, string[]>()
  positions.forEach((assignment) => {
    const name = assignment.club_positions?.name
    const slug = assignment.club_positions?.slug
    if (!name || !slug) return
    positionsByProfile.set(assignment.volunteer_profile_id, [...(positionsByProfile.get(assignment.volunteer_profile_id) ?? []), name])
    positionSlugsByProfile.set(assignment.volunteer_profile_id, [...(positionSlugsByProfile.get(assignment.volunteer_profile_id) ?? []), slug])
  })

  const rolesByProfile = new Map<string, string[]>()
  roles.forEach((role) => {
    rolesByProfile.set(role.volunteer_profile_id, [...(rolesByProfile.get(role.volunteer_profile_id) ?? []), role.role])
  })

  const membershipsByProfile = new Map<string, AccessUserSummary['activeDepartmentMemberships']>()
  memberships.forEach((membership) => {
    const department = membership.club_departments
    if (!department?.name || !department.slug) return
    membershipsByProfile.set(membership.volunteer_profile_id, [
      ...(membershipsByProfile.get(membership.volunteer_profile_id) ?? []),
      {
        departmentName: department.name,
        departmentSlug: department.slug,
        role: membership.department_role,
      },
    ])
  })

  return profiles.map((profile) => ({
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    accountStatus: profile.account_status,
    onboardingStatus: profile.onboarding_status,
    activeClubPositions: positionsByProfile.get(profile.id) ?? [],
    activeClubPositionSlugs: positionSlugsByProfile.get(profile.id) ?? [],
    activePlatformRoles: rolesByProfile.get(profile.id) ?? [],
    activeDepartmentMemberships: membershipsByProfile.get(profile.id) ?? [],
  }))
}

export async function getAccessUsers(profileId?: string): Promise<AccessUserSummary[]>{
  const supabase = await createServerSupabaseClient()
  let profileQuery = supabase
    .from('volunteer_profiles')
    .select('id, full_name, email, account_status, onboarding_status')
    .neq('account_status', 'archived')
    .neq('account_status', 'rejected')
    .is('archived_at', null)
    .order('full_name', { ascending: true })
    .limit(profileId ? 1 : 80)

  if (profileId) {
    profileQuery = profileQuery.eq('id', profileId)
  }

  const { data: profiles } = await profileQuery
  const profileRows = (profiles ?? []) as ProfileRow[]
  const profileIds = profileRows.map((profile) => profile.id)

  if (profileIds.length === 0) {
    return []
  }

  const [{ data: positions }, { data: roles }, { data: memberships }] = await Promise.all([
    supabase
      .from('volunteer_club_positions')
      .select('volunteer_profile_id, club_positions(name,slug)')
      .in('volunteer_profile_id', profileIds)
      .eq('status', 'active'),
    supabase
      .from('volunteer_platform_roles')
      .select('volunteer_profile_id, role')
      .in('volunteer_profile_id', profileIds)
      .eq('status', 'active'),
    supabase
      .from('volunteer_department_memberships')
      .select('volunteer_profile_id, department_role, club_departments(name,slug)')
      .in('volunteer_profile_id', profileIds)
      .eq('membership_status', 'approved'),
  ])

  return summarizeUsers(
    profileRows,
    (positions ?? []) as unknown as ClubPositionAssignmentRow[],
    (roles ?? []) as PlatformRoleRow[],
    (memberships ?? []) as unknown as DepartmentMembershipRow[],
  )
}

type RawPermissionPolicy = {
  id: string
  scope_rule: string
  requires_approval: boolean | null
  approval_policy_key: string | null
  system_permissions: {
    permission_key: string | null
    name: string | null
    module_key: string | null
    risk_level: string | null
  } | null
}

type RawPositionPolicy = RawPermissionPolicy & {
  club_position_slug: string
}

type RawDepartmentRolePolicy = RawPermissionPolicy & {
  department_role: string
}

type RawPlatformRolePolicy = RawPermissionPolicy & {
  platform_role: string
}

function toPolicySummary(policy: RawPermissionPolicy): PermissionPolicySummary | null{
  const permission = policy.system_permissions

  if (!permission?.permission_key || !permission.name || !permission.module_key || !permission.risk_level) {
    return null
  }

  return {
    id: policy.id,
    permissionKey: permission.permission_key,
    permissionName: permission.name,
    moduleKey: permission.module_key,
    riskLevel: permission.risk_level,
    scopeRule: policy.scope_rule,
    requiresApproval: Boolean(policy.requires_approval),
    approvalPolicyKey: policy.approval_policy_key,
  }
}

function groupPolicies<T extends RawPermissionPolicy>(policies: T[], groupKey: (policy: T) => string): Record<string, PermissionPolicySummary[]>{
  return policies.reduce<Record<string, PermissionPolicySummary[]>>((groups, policy) => {
    const summary = toPolicySummary(policy)
    if (!summary) return groups

    const key = groupKey(policy)
    groups[key] = [...(groups[key] ?? []), summary]
    return groups
  }, {})
}

function groupPermissionsByModule(permissions: Array<Pick<SystemPermission, 'id' | 'permission_key' | 'name' | 'description' | 'risk_level' | 'module_key'>>): OfficialPermissionMatrix['permissionsByModule']{
  const grouped = permissions.reduce<Map<string, OfficialPermissionMatrix['permissionsByModule'][number]>>((modules, permission) => {
    const current = modules.get(permission.module_key) ?? { moduleKey: permission.module_key, permissions: [] }
    current.permissions.push({
      id: permission.id,
      permission_key: permission.permission_key,
      name: permission.name,
      description: permission.description,
      risk_level: permission.risk_level,
    })
    modules.set(permission.module_key, current)
    return modules
  }, new Map())

  return Array.from(grouped.values())
}

export async function getOfficialPermissionMatrix(): Promise<OfficialPermissionMatrix>{
  const supabase = await createServerSupabaseClient()
  const [{ data: permissions }, { data: positionPolicies }, { data: departmentRolePolicies }, { data: platformRolePolicies }] = await Promise.all([
    supabase
      .from('system_permissions')
      .select('id, permission_key, name, description, risk_level, module_key')
      .eq('is_active', true)
      .in('module_key', ['event', 'task', 'user', 'department', 'content', 'committee', 'blood', 'finance'])
      .order('module_key', { ascending: true })
      .order('permission_key', { ascending: true }),
    supabase
      .from('club_position_permission_policies')
      .select('id, club_position_slug, scope_rule, requires_approval, approval_policy_key, system_permissions(permission_key,name,module_key,risk_level)')
      .eq('is_active', true)
      .order('club_position_slug', { ascending: true }),
    supabase
      .from('department_role_permission_policies')
      .select('id, department_role, scope_rule, requires_approval, approval_policy_key, system_permissions(permission_key,name,module_key,risk_level)')
      .eq('is_active', true)
      .order('department_role', { ascending: true }),
    supabase
      .from('platform_role_permission_policies')
      .select('id, platform_role, scope_rule, requires_approval, approval_policy_key, system_permissions(permission_key,name,module_key,risk_level)')
      .eq('is_active', true)
      .order('platform_role', { ascending: true }),
  ])

  return {
    permissionsByModule: groupPermissionsByModule((permissions ?? []) as Array<Pick<SystemPermission, 'id' | 'permission_key' | 'name' | 'description' | 'risk_level' | 'module_key'>>),
    positionPolicies: groupPolicies((positionPolicies ?? []) as unknown as RawPositionPolicy[], (policy) => policy.club_position_slug),
    departmentRolePolicies: groupPolicies((departmentRolePolicies ?? []) as unknown as RawDepartmentRolePolicy[], (policy) => policy.department_role),
    platformRolePolicies: groupPolicies((platformRolePolicies ?? []) as unknown as RawPlatformRolePolicy[], (policy) => policy.platform_role),
  }
}

export async function getAccessReviewUsers(): Promise<AccessReviewUser[]>{
  const [users, matrix] = await Promise.all([getAccessUsers(), getOfficialPermissionMatrix()])

  return users.map((user) => {
    const sources: AccessReviewUser['permissionSummary'] = []

    user.activePlatformRoles.forEach((role) => {
      const permissions = matrix.platformRolePolicies[role] ?? []
      if (permissions.length > 0) {
        sources.push({ source: `Platform role: ${role}`, permissions })
      }
    })

    user.activeClubPositions.forEach((position, index) => {
      const slug = user.activeClubPositionSlugs[index]
      const permissions = matrix.positionPolicies[slug] ?? []
      if (permissions.length > 0) {
        sources.push({ source: `Club position: ${position}`, permissions })
      }
    })

    user.activeDepartmentMemberships.forEach((membership) => {
      const permissions = matrix.departmentRolePolicies[membership.role] ?? []
      if (permissions.length > 0) {
        sources.push({ source: `${membership.departmentName}: ${membership.role}`, permissions })
      }
    })

    return {
      ...user,
      permissionSummary: sources,
    }
  })
}

export async function getAccessControlSummary(): Promise<AccessControlSummary>{
  const supabase = await createServerSupabaseClient()
  const [{ data: permissions }, { data: overrides }, usersResult, { data: departments }, { data: eventOperations }] = await Promise.all([
    supabase
      .from('system_permissions')
      .select('*')
      .eq('is_active', true)
      .order('module_key', { ascending: true })
      .order('permission_key', { ascending: true }),
    supabase
      .from('user_permission_overrides')
      .select('*, system_permissions(permission_key,name,risk_level), volunteer_profiles!user_permission_overrides_volunteer_profile_id_fkey(full_name,email)')
      .order('created_at', { ascending: false })
      .limit(50),
    getAccessUsers(),
    supabase
      .from('club_departments')
      .select('id, name, slug')
      .eq('status', 'active')
      .is('archived_at', null)
      .order('display_order', { ascending: true }),
    supabase
      .from('club_event_operations')
      .select('operational_status, events(id,title,event_date,status)')
      .not('operational_status', 'in', '("cancelled","archived")')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const events: AccessControlSummary['events'] = ((eventOperations ?? []) as unknown as Array<{ operational_status: string; events: { id: string; title: string; event_date: string; status: string } | null }>)
    .map((operation) => operation.events ? { ...operation.events, operational_status: operation.operational_status } : null)
    .filter((event) => event !== null)

  return {
    permissions: (permissions ?? []) as SystemPermission[],
    overrides: (overrides ?? []) as unknown as AccessOverrideSummary[],
    users: usersResult,
    departments: departments ?? [],
    events: events ?? [],
  }
}

export async function getAccessUserDetail(profileId: string): Promise<AccessUserDetail | null>{
  const supabase = await createServerSupabaseClient()
  const [user] = await getAccessUsers(profileId)

  if (!user) {
    return null
  }

  const [{ data: overrides }, { data: permissions }] = await Promise.all([
    supabase
      .from('user_permission_overrides')
      .select('*, system_permissions(permission_key,name,risk_level), volunteer_profiles!user_permission_overrides_volunteer_profile_id_fkey(full_name,email)')
      .eq('volunteer_profile_id', profileId)
      .order('created_at', { ascending: false }),
    supabase
      .from('system_permissions')
      .select('permission_key, name, risk_level, module_key')
      .eq('is_active', true)
      .order('module_key', { ascending: true })
      .order('permission_key', { ascending: true }),
  ])

  const overrideRows = (overrides ?? []) as unknown as AccessOverrideSummary[]
  const now = Date.now()
  const temporaryAllows = overrideRows.filter((override) => override.effect === 'allow' && override.status === 'active' && (!override.expires_at || new Date(override.expires_at).getTime() > now))
  const temporaryDenies = overrideRows.filter((override) => override.effect === 'deny' && override.status === 'active' && (!override.expires_at || new Date(override.expires_at).getTime() > now))
  const scheduledOverrides = overrideRows.filter((override) => override.status === 'scheduled')
  const historicalOverrides = overrideRows.filter((override) => ['expired', 'revoked', 'cancelled'].includes(override.status) || (override.expires_at ? new Date(override.expires_at).getTime() <= now : false))
  const groupedPermissions = new Map<string, Array<Pick<SystemPermission, 'permission_key' | 'name' | 'risk_level'>>>()

  ;((permissions ?? []) as Array<Pick<SystemPermission, 'permission_key' | 'name' | 'risk_level' | 'module_key'>>).forEach((permission) => {
    groupedPermissions.set(permission.module_key, [
      ...(groupedPermissions.get(permission.module_key) ?? []),
      {
        permission_key: permission.permission_key,
        name: permission.name,
        risk_level: permission.risk_level,
      },
    ])
  })

  return {
    ...user,
    temporaryAllows,
    temporaryDenies,
    scheduledOverrides,
    historicalOverrides,
    effectiveAccessSummary: Array.from(groupedPermissions.entries()).map(([moduleKey, modulePermissions]) => ({
      moduleKey,
      permissions: modulePermissions,
    })),
  }
}
