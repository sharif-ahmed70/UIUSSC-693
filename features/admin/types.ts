import type { StaffAccessContext } from '@/features/staff/types'

export type AdminPermissions = {
  canReviewMembershipApplications: boolean
  canManageVolunteers: boolean
  canManageDepartments: boolean
  canManagePlatformRoles: boolean
  canViewAuditLogs: boolean
}

export type AdminContext = {
  staff: StaffAccessContext
  permissions: AdminPermissions
  isAdmin: boolean
}

export type AdminListParams = {
  page: number
  pageSize: number
  search?: string
  status?: string
}

export type AdminActionState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Record<string, string[]>
}

export const initialAdminActionState: AdminActionState = {
  status: 'idle',
}
