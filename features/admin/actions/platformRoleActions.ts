'use server'

import type { AdminActionState } from '@/features/admin/types'
import { platformRoleAssignSchema, platformRoleRevokeSchema } from './schemas'
import { requireAdminAction, safeActionError, successAction } from './actionUtils'

export async function assignPlatformRoleAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = platformRoleAssignSchema.safeParse({ profileId: formData.get('profileId'), role: formData.get('role'), reason: formData.get('reason') })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManagePlatformRoles')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('assign_platform_role', { p_profile_id: parsed.data.profileId, p_role: parsed.data.role, p_reason: parsed.data.reason })
  if (error) return safeActionError()
  return successAction(['/admin/platform-roles'])
}

export async function revokePlatformRoleAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = platformRoleRevokeSchema.safeParse({ id: formData.get('id'), reason: formData.get('reason') })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManagePlatformRoles')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('revoke_platform_role', { p_platform_role_id: parsed.data.id, p_reason: parsed.data.reason })
  if (error) return safeActionError()
  return successAction(['/admin/platform-roles'])
}
