'use server'

import type { AdminActionState } from '@/features/admin/types'
import { requireAdminAction, safeActionError, successAction } from '@/features/admin/actions/actionUtils'
import { approvalExecuteSchema, approvalReviewSchema } from './schemas'

export async function reviewApprovalRequestAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = approvalReviewSchema.safeParse({
    id: formData.get('id'),
    decision: formData.get('decision'),
    reason: formData.get('reason'),
  })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }

  const admin = await requireAdminAction('canReviewApprovalRequests')
  if ('error' in admin) return admin.error

  const { error } = await admin.supabase.rpc('review_approval_request', {
    p_request_id: parsed.data.id,
    p_decision: parsed.data.decision,
    p_reason: parsed.data.reason,
  })

  if (error) return safeActionError()
  return successAction(['/admin/approval-requests'])
}

export async function executeApprovalRequestAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = approvalExecuteSchema.safeParse({ id: formData.get('id'), reason: formData.get('reason') })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }

  const admin = await requireAdminAction('canReviewApprovalRequests')
  if ('error' in admin) return admin.error

  const { error } = await admin.supabase.rpc('execute_approved_request', {
    p_request_id: parsed.data.id,
    p_reason: parsed.data.reason,
  })

  if (error) return safeActionError()
  return successAction(['/admin/approval-requests'])
}
