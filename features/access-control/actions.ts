'use server'

import type { AdminActionState } from '@/features/admin/types'
import { requireAdminAction, safeActionError, successAction } from '@/features/admin/actions/actionUtils'
import type { Database } from '@/types/supabase'
import { revokeTemporaryAccessSchema, temporaryAccessSchema } from './schemas'

function emptyToNull(value: string | undefined){
  return value && value.length > 0 ? value : null
}

export async function grantTemporaryAccessAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = temporaryAccessSchema.safeParse({
    profileId: formData.get('profileId'),
    permissionKey: formData.get('permissionKey'),
    effect: formData.get('effect'),
    scopeType: formData.get('scopeType'),
    departmentId: formData.get('departmentId') || undefined,
    eventId: formData.get('eventId') || undefined,
    targetRecordType: formData.get('targetRecordType') || undefined,
    targetRecordId: formData.get('targetRecordId') || undefined,
    startsAt: formData.get('startsAt') || undefined,
    expiresAt: formData.get('expiresAt') || undefined,
    reason: formData.get('reason'),
  })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }

  const admin = await requireAdminAction('canManageAccessGrants')
  if ('error' in admin) return admin.error

  const { data: permission } = await admin.supabase
    .from('system_permissions')
    .select('supports_global_scope, supports_department_scope')
    .eq('permission_key', parsed.data.permissionKey)
    .eq('is_active', true)
    .maybeSingle()

  if (!permission) {
    return { status: 'error', message: 'Select a valid active permission.' }
  }

  if (parsed.data.scopeType === 'global' && !permission.supports_global_scope) {
    return { status: 'error', message: 'This permission does not support global scope.' }
  }

  if (parsed.data.scopeType === 'department' && !permission.supports_department_scope) {
    return { status: 'error', message: 'This permission does not support department scope.' }
  }

  const args = {
    p_profile_id: parsed.data.profileId,
    p_permission_key: parsed.data.permissionKey,
    p_effect: parsed.data.effect,
    p_scope_type: parsed.data.scopeType,
    p_department_id: emptyToNull(parsed.data.departmentId),
    p_event_id: emptyToNull(parsed.data.eventId),
    p_target_record_type: emptyToNull(parsed.data.targetRecordType),
    p_target_record_id: emptyToNull(parsed.data.targetRecordId),
    p_starts_at: emptyToNull(parsed.data.startsAt),
    p_expires_at: emptyToNull(parsed.data.expiresAt),
    p_reason: parsed.data.reason,
  } as unknown as Database['public']['Functions']['grant_temporary_access']['Args']

  const { error } = await admin.supabase.rpc('grant_temporary_access', args)

  if (error) return safeActionError()
  return successAction(['/admin/access-control'])
}

export async function revokeTemporaryAccessAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = revokeTemporaryAccessSchema.safeParse({ id: formData.get('id'), reason: formData.get('reason') })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }

  const admin = await requireAdminAction('canManageAccessGrants')
  if ('error' in admin) return admin.error

  const { error } = await admin.supabase.rpc('revoke_temporary_access', {
    p_override_id: parsed.data.id,
    p_reason: parsed.data.reason,
  })

  if (error) return safeActionError()
  return successAction(['/admin/access-control'])
}
