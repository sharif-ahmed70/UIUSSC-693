'use server'

import type { AdminActionState } from '@/features/admin/types'
import { departmentRoleSchema, requiredReasonActionSchema, volunteerActionSchema } from './schemas'
import { requireAdminAction, safeActionError, successAction } from './actionUtils'

export async function approveDepartmentMembershipAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = volunteerActionSchema.safeParse({ id: formData.get('id'), reason: formData.get('reason') || undefined })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageVolunteers')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('approve_department_membership', { p_membership_id: parsed.data.id, p_reason: parsed.data.reason })
  if (error) return safeActionError()
  return successAction(['/admin', '/admin/department-memberships'])
}

export async function rejectDepartmentMembershipAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  return requiredMembershipAction(formData, 'reject_department_membership')
}

export async function suspendDepartmentMembershipAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  return requiredMembershipAction(formData, 'suspend_department_membership')
}

export async function removeDepartmentMembershipAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  return requiredMembershipAction(formData, 'remove_department_membership')
}

export async function changeDepartmentRoleAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = departmentRoleSchema.safeParse({ id: formData.get('id'), role: formData.get('role'), reason: formData.get('reason') || undefined })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageVolunteers')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('change_department_role', { p_membership_id: parsed.data.id, p_department_role: parsed.data.role, p_reason: parsed.data.reason ?? '' })
  if (error) return safeActionError()
  return successAction(['/admin/department-memberships'])
}

export async function setPrimaryDepartmentAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = volunteerActionSchema.safeParse({ id: formData.get('id'), reason: formData.get('reason') || undefined })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageVolunteers')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('set_primary_department', { p_membership_id: parsed.data.id, p_reason: parsed.data.reason })
  if (error) return safeActionError()
  return successAction(['/admin/department-memberships'])
}

async function requiredMembershipAction(formData: FormData, rpc: 'reject_department_membership' | 'suspend_department_membership' | 'remove_department_membership'): Promise<AdminActionState>{
  const parsed = requiredReasonActionSchema.safeParse({ id: formData.get('id'), reason: formData.get('reason') })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageVolunteers')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc(rpc, { p_membership_id: parsed.data.id, p_reason: parsed.data.reason })
  if (error) return safeActionError()
  return successAction(['/admin/department-memberships'])
}
