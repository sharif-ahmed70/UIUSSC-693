'use server'

import type { AdminActionState } from '@/features/admin/types'
import { requireAdminAction, safeActionError, successAction } from '@/features/admin/actions/actionUtils'
import type { Database } from '@/types/supabase'
import { cancelStaffInvitationSchema, staffInvitationSchema } from './schemas'

function emptyToNull(value: string | undefined){
  return value && value.length > 0 ? value : null
}

export async function createStaffInvitationAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = staffInvitationSchema.safeParse({
    invitedEmail: formData.get('invitedEmail'),
    invitedName: formData.get('invitedName') || undefined,
    intendedClubPositionId: formData.get('intendedClubPositionId') || undefined,
    intendedPlatformRole: formData.get('intendedPlatformRole') || '',
    expiresAt: formData.get('expiresAt') || undefined,
    reason: formData.get('reason'),
  })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }

  const admin = await requireAdminAction('canCreateStaffInvitations')
  if ('error' in admin) return admin.error

  const args = {
    p_invited_email: parsed.data.invitedEmail,
    p_invited_name: emptyToNull(parsed.data.invitedName),
    p_intended_club_position_id: emptyToNull(parsed.data.intendedClubPositionId),
    p_intended_platform_role: emptyToNull(parsed.data.intendedPlatformRole),
    p_expires_at: emptyToNull(parsed.data.expiresAt),
    p_department_scopes: [],
    p_reason: parsed.data.reason,
  } as unknown as Database['public']['Functions']['create_staff_invitation']['Args']

  const { error } = await admin.supabase.rpc('create_staff_invitation', args)

  if (error) return safeActionError()
  return successAction(['/admin/staff-invitations'])
}

export async function cancelStaffInvitationAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = cancelStaffInvitationSchema.safeParse({ id: formData.get('id'), reason: formData.get('reason') })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }

  const admin = await requireAdminAction('canCreateStaffInvitations')
  if ('error' in admin) return admin.error

  const { error } = await admin.supabase.rpc('cancel_staff_invitation', {
    p_invitation_id: parsed.data.id,
    p_reason: parsed.data.reason,
  })

  if (error) return safeActionError()
  return successAction(['/admin/staff-invitations'])
}
