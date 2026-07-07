import type { Database } from '@/types/supabase'

export type SystemPermission = Database['public']['Tables']['system_permissions']['Row']
export type UserPermissionOverride = Database['public']['Tables']['user_permission_overrides']['Row']
export type ClubDepartment = Database['public']['Tables']['club_departments']['Row']
export type ClubPosition = Database['public']['Tables']['club_positions']['Row']
export type EventRow = Database['public']['Tables']['events']['Row']

export type AccessUserSummary = {
  id: string
  fullName: string
  email: string
  accountStatus: string
  onboardingStatus: string
  activeClubPositions: string[]
  activeClubPositionSlugs: string[]
  activePlatformRoles: string[]
  activeDepartmentMemberships: Array<{
    departmentName: string
    departmentSlug: string
    role: string
  }>
}

export type AccessOverrideSummary = UserPermissionOverride & {
  system_permissions: Pick<SystemPermission, 'permission_key' | 'name' | 'risk_level'> | null
  volunteer_profiles: { full_name: string | null; email: string | null } | null
}

export type AccessControlSummary = {
  permissions: SystemPermission[]
  overrides: AccessOverrideSummary[]
  users: AccessUserSummary[]
  departments: Pick<ClubDepartment, 'id' | 'name' | 'slug'>[]
  events: Array<Pick<EventRow, 'id' | 'title' | 'event_date' | 'status'> & { operational_status?: string | null }>
}

export type AccessUserDetail = AccessUserSummary & {
  temporaryAllows: AccessOverrideSummary[]
  temporaryDenies: AccessOverrideSummary[]
  scheduledOverrides: AccessOverrideSummary[]
  historicalOverrides: AccessOverrideSummary[]
  effectiveAccessSummary: Array<{
    moduleKey: string
    permissions: Array<Pick<SystemPermission, 'permission_key' | 'name' | 'risk_level'>>
  }>
}

export type PermissionPolicySummary = {
  id: string
  permissionKey: string
  permissionName: string
  moduleKey: string
  riskLevel: string
  scopeRule: string
  requiresApproval: boolean
  approvalPolicyKey: string | null
}

export type OfficialPermissionMatrix = {
  permissionsByModule: Array<{
    moduleKey: string
    permissions: Array<Pick<SystemPermission, 'id' | 'permission_key' | 'name' | 'description' | 'risk_level'>>
  }>
  positionPolicies: Record<string, PermissionPolicySummary[]>
  departmentRolePolicies: Record<string, PermissionPolicySummary[]>
  platformRolePolicies: Record<string, PermissionPolicySummary[]>
}

export type AccessReviewUser = AccessUserSummary & {
  permissionSummary: Array<{
    source: string
    permissions: PermissionPolicySummary[]
  }>
}
