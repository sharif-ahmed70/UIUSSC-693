'use server'

import { z } from 'zod'
import type { AdminActionState } from '@/features/admin/types'
import { requireAdminAction, safeActionError, successAction } from '@/features/admin/actions/actionUtils'

const idSchema = z.string().uuid()
const reasonSchema = z.string().trim().min(3, 'Reason is required.').max(500)

const createCommitteeSchema = z.object({
  name: z.string().trim().min(3).max(140),
  sessionLabel: z.string().trim().min(4).max(40),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().optional(),
}).refine((value) => !value.endDate || value.endDate >= value.startDate, {
  message: 'End date cannot be before start date.',
  path: ['endDate'],
})

const assignCommitteeMemberSchema = z.object({
  committeeId: idSchema,
  profileId: idSchema,
  positionId: idSchema,
  startDate: z.string().trim().optional(),
  reason: z.string().trim().max(500).optional(),
})

const committeeActionSchema = z.object({
  id: idSchema,
  reason: z.string().trim().max(500).optional(),
})

const committeeReasonActionSchema = z.object({
  id: idSchema,
  reason: reasonSchema,
})

const endCommitteeMemberSchema = z.object({
  id: idSchema,
  endDate: z.string().trim().min(1),
  reason: reasonSchema,
})

export async function createCommitteeAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = createCommitteeSchema.safeParse({
    name: formData.get('name'),
    sessionLabel: formData.get('sessionLabel'),
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate') || undefined,
  })
  if (!parsed.success) return { status: 'error', message: 'Please review the committee details.', fieldErrors: parsed.error.flatten().fieldErrors }

  const admin = await requireAdminAction('canManageCommittees')
  if ('error' in admin) return admin.error

  const { error } = await admin.supabase.rpc('create_committee' as never, {
    p_name: parsed.data.name,
    p_session_label: parsed.data.sessionLabel,
    p_start_date: parsed.data.startDate,
    p_end_date: parsed.data.endDate ?? null,
  } as never)

  if (error?.code === '23505') return { status: 'error', message: 'A committee for this session already exists.' }
  if (error) return safeActionError()
  return successAction(['/admin/committees'])
}

export async function assignCommitteeMemberAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = assignCommitteeMemberSchema.safeParse({
    committeeId: formData.get('committeeId'),
    profileId: formData.get('profileId'),
    positionId: formData.get('positionId'),
    startDate: formData.get('startDate') || undefined,
    reason: formData.get('reason') || undefined,
  })
  if (!parsed.success) return { status: 'error', message: 'Please review the leadership assignment.', fieldErrors: parsed.error.flatten().fieldErrors }

  const admin = await requireAdminAction('canManageCommittees')
  if ('error' in admin) return admin.error

  const { error } = await admin.supabase.rpc('assign_committee_member' as never, {
    p_committee_id: parsed.data.committeeId,
    p_profile_id: parsed.data.profileId,
    p_position_id: parsed.data.positionId,
    p_start_date: parsed.data.startDate || undefined,
    p_reason: parsed.data.reason,
  } as never)

  if (error?.code === '23505') return { status: 'error', message: 'This position already has an active holder in the committee.' }
  if (error) return safeActionError()
  return successAction(['/admin/committees', `/admin/committees/${parsed.data.committeeId}`])
}

export async function activateCommitteeAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = committeeActionSchema.safeParse({ id: formData.get('id'), reason: formData.get('reason') || undefined })
  if (!parsed.success) return { status: 'error', message: 'Please review the activation request.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageCommittees')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('activate_committee' as never, { p_committee_id: parsed.data.id, p_reason: parsed.data.reason } as never)
  if (error) return safeActionError()
  return successAction(['/admin/committees', `/admin/committees/${parsed.data.id}`, '/about/team'])
}

export async function completeCommitteeAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = committeeReasonActionSchema.safeParse({ id: formData.get('id'), reason: formData.get('reason') })
  if (!parsed.success) return { status: 'error', message: 'Please provide a completion reason.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageCommittees')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('complete_committee' as never, { p_committee_id: parsed.data.id, p_reason: parsed.data.reason } as never)
  if (error) return safeActionError()
  return successAction(['/admin/committees', `/admin/committees/${parsed.data.id}`, '/about/team'])
}

export async function archiveCommitteeAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = committeeReasonActionSchema.safeParse({ id: formData.get('id'), reason: formData.get('reason') })
  if (!parsed.success) return { status: 'error', message: 'Please provide an archive reason.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageCommittees')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('archive_committee' as never, { p_committee_id: parsed.data.id, p_reason: parsed.data.reason } as never)
  if (error) return safeActionError()
  return successAction(['/admin/committees', `/admin/committees/${parsed.data.id}`, '/about/team'])
}

export async function endCommitteeMemberAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = endCommitteeMemberSchema.safeParse({ id: formData.get('id'), endDate: formData.get('endDate'), reason: formData.get('reason') })
  if (!parsed.success) return { status: 'error', message: 'Please provide an end date and reason.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageCommittees')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('end_committee_member' as never, {
    p_committee_membership_id: parsed.data.id,
    p_end_date: parsed.data.endDate,
    p_reason: parsed.data.reason,
  } as never)
  if (error) return safeActionError()
  return successAction(['/admin/committees'])
}
