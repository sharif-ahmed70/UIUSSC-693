import type { DepartmentRole, PlatformRole } from '@/features/staff/types'

const platformRoleLabels: Record<PlatformRole, string> = {
  super_admin: 'Super Admin',
  club_admin: 'Club Admin',
  membership_admin: 'Membership Admin',
  content_admin: 'Content Admin',
  department_admin: 'Department Admin',
}

export function formatPlatformRole(role: PlatformRole | string){
  return platformRoleLabels[role as PlatformRole] ?? role.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const departmentRoleLabels: Record<DepartmentRole, string> = {
  department_head: 'Department Head',
  deputy_head: 'Deputy Head',
  executive: 'Executive',
}

export function formatDepartmentRole(role: DepartmentRole | string){
  return departmentRoleLabels[role as DepartmentRole] ?? role.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function maskEmail(email: string | null | undefined){
  if (!email) return null
  const [local, domain] = email.split('@')
  if (!local || !domain) return null
  return `${local.slice(0, 1)}***@${domain}`
}
