'use server'

import type { AdminActionState } from '@/features/admin/types'
import { requiredReasonActionSchema, volunteerActionSchema } from './schemas'
import { requireAdminAction, safeActionError, successAction } from './actionUtils'

export async function approveVolunteerAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = volunteerActionSchema.safeParse({ id: formData.get('id'), reason: formData.get('reason') || undefined })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageVolunteers')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('approve_volunteer_profile', { p_profile_id: parsed.data.id, p_reason: parsed.data.reason })
  if (error) return safeActionError()
  return successAction(['/admin', '/admin/volunteers', `/admin/volunteers/${parsed.data.id}`])
}

export async function rejectVolunteerAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = requiredReasonActionSchema.safeParse({ id: formData.get('id'), reason: formData.get('reason') })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageVolunteers')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('reject_volunteer_profile', { p_profile_id: parsed.data.id, p_reason: parsed.data.reason })
  if (error) return safeActionError()
  return successAction(['/admin', '/admin/volunteers', `/admin/volunteers/${parsed.data.id}`])
}

export async function suspendVolunteerAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = requiredReasonActionSchema.safeParse({ id: formData.get('id'), reason: formData.get('reason') })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageVolunteers')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('suspend_volunteer_profile', { p_profile_id: parsed.data.id, p_reason: parsed.data.reason })
  if (error) return safeActionError()
  return successAction(['/admin', '/admin/volunteers', `/admin/volunteers/${parsed.data.id}`])
}

export async function restoreVolunteerAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = requiredReasonActionSchema.safeParse({ id: formData.get('id'), reason: formData.get('reason') })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageVolunteers')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('restore_volunteer_profile', { p_profile_id: parsed.data.id, p_reason: parsed.data.reason })
  if (error) return safeActionError()
  return successAction(['/admin', '/admin/volunteers', `/admin/volunteers/${parsed.data.id}`])
}
