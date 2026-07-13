'use server'

import type { AdminActionState } from '@/features/admin/types'
import { membershipApplicationReviewSchema } from './schemas'
import { requireAdminAction, safeActionError, successAction } from './actionUtils'

export async function reviewMembershipApplicationAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = membershipApplicationReviewSchema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
    reason: formData.get('reason') || undefined,
    adminNotes: formData.get('adminNotes') || undefined,
  })

  if (!parsed.success) {
    return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const admin = await requireAdminAction('canReviewMembershipApplications')
  if ('error' in admin) return admin.error

  const { error } = await admin.supabase.rpc('review_membership_application', {
    p_application_id: parsed.data.id,
    p_status: parsed.data.status,
    p_reason: parsed.data.reason,
    p_admin_notes: parsed.data.adminNotes,
  })

  if (error) return safeActionError()
  return successAction(['/admin', '/admin/membership-applications', `/admin/membership-applications/${parsed.data.id}`])
}
