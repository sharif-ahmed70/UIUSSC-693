'use server'

import type { AdminActionState } from '@/features/admin/types'
import { idSchema, reasonSchema } from './schemas'
import { requireAdminAction, safeActionError, successAction } from './actionUtils'
import { z } from 'zod'

const positionCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).optional(),
  isCorePanel: z.boolean().optional(),
  displayOrder: z.coerce.number().int().min(0).max(999),
})

const positionUpdateSchema = positionCreateSchema.extend({
  id: idSchema,
  status: z.enum(['active', 'inactive']),
  reason: z.string().trim().max(500).optional(),
})

const assignPositionSchema = z.object({
  profileId: idSchema,
  positionId: idSchema,
  isPrimary: z.boolean().optional(),
  termStart: z.string().trim().optional(),
  reason: z.string().trim().max(500).optional(),
})

const assignmentActionSchema = z.object({
  id: idSchema,
  reason: z.string().trim().max(500).optional(),
})

export async function createClubPositionAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = positionCreateSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || undefined,
    isCorePanel: formData.get('isCorePanel') === 'on',
    displayOrder: formData.get('displayOrder') || 0,
  })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageVolunteers')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('create_club_position', {
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
    p_description: parsed.data.description,
    p_is_core_panel: parsed.data.isCorePanel ?? false,
    p_display_order: parsed.data.displayOrder,
  })
  if (error) return safeActionError()
  return successAction(['/admin/club-positions'])
}

export async function updateClubPositionAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = positionUpdateSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || undefined,
    isCorePanel: formData.get('isCorePanel') === 'on',
    status: formData.get('status'),
    displayOrder: formData.get('displayOrder') || 0,
    reason: formData.get('reason') || undefined,
  })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageVolunteers')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('update_club_position', {
    p_position_id: parsed.data.id,
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
    p_description: parsed.data.description ?? '',
    p_is_core_panel: parsed.data.isCorePanel ?? false,
    p_status: parsed.data.status,
    p_display_order: parsed.data.displayOrder,
    p_reason: parsed.data.reason,
  })
  if (error) return safeActionError()
  return successAction(['/admin/club-positions'])
}

export async function archiveClubPositionAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = z.object({ id: idSchema, reason: reasonSchema }).safeParse({ id: formData.get('id'), reason: formData.get('reason') })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageVolunteers')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('archive_club_position', { p_position_id: parsed.data.id, p_reason: parsed.data.reason })
  if (error) return safeActionError()
  return successAction(['/admin/club-positions'])
}

export async function assignVolunteerClubPositionAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = assignPositionSchema.safeParse({
    profileId: formData.get('profileId'),
    positionId: formData.get('positionId'),
    isPrimary: formData.get('isPrimary') === 'on',
    termStart: formData.get('termStart') || undefined,
    reason: formData.get('reason') || undefined,
  })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageVolunteers')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('assign_volunteer_club_position', {
    p_profile_id: parsed.data.profileId,
    p_position_id: parsed.data.positionId,
    p_is_primary: parsed.data.isPrimary ?? true,
    p_term_start: parsed.data.termStart,
    p_reason: parsed.data.reason,
  })
  if (error) return safeActionError()
  return successAction(['/admin/club-positions'])
}

export async function completeVolunteerClubPositionAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = assignmentActionSchema.safeParse({ id: formData.get('id'), reason: formData.get('reason') || undefined })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageVolunteers')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('complete_volunteer_club_position', { p_assignment_id: parsed.data.id, p_reason: parsed.data.reason })
  if (error) return safeActionError()
  return successAction(['/admin/club-positions'])
}

export async function revokeVolunteerClubPositionAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = z.object({ id: idSchema, reason: reasonSchema }).safeParse({ id: formData.get('id'), reason: formData.get('reason') })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageVolunteers')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('revoke_volunteer_club_position', { p_assignment_id: parsed.data.id, p_reason: parsed.data.reason })
  if (error) return safeActionError()
  return successAction(['/admin/club-positions'])
}

export async function changePrimaryClubPositionAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = assignmentActionSchema.safeParse({ id: formData.get('id'), reason: formData.get('reason') || undefined })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageVolunteers')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('change_primary_club_position', { p_assignment_id: parsed.data.id, p_reason: parsed.data.reason })
  if (error) return safeActionError()
  return successAction(['/admin/club-positions'])
}
