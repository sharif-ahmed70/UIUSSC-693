'use server'

import type { AdminActionState } from '@/features/admin/types'
import { departmentCreateSchema, departmentUpdateSchema, requiredReasonActionSchema } from './schemas'
import { requireAdminAction, safeActionError, successAction } from './actionUtils'

export async function createDepartmentAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = departmentCreateSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    shortDescription: formData.get('shortDescription') || undefined,
    displayOrder: formData.get('displayOrder') || 0,
  })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageDepartments')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('create_club_department', {
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
    p_short_description: parsed.data.shortDescription,
    p_display_order: parsed.data.displayOrder,
  })
  if (error) return safeActionError()
  return successAction(['/admin/departments'])
}

export async function updateDepartmentAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = departmentUpdateSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    slug: formData.get('slug'),
    shortDescription: formData.get('shortDescription') || undefined,
    status: formData.get('status'),
    displayOrder: formData.get('displayOrder') || 0,
    reason: formData.get('reason') || undefined,
  })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageDepartments')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('update_club_department', {
    p_department_id: parsed.data.id,
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
    p_short_description: parsed.data.shortDescription ?? '',
    p_status: parsed.data.status,
    p_display_order: parsed.data.displayOrder,
    p_reason: parsed.data.reason,
  })
  if (error) return safeActionError()
  return successAction(['/admin/departments'])
}

export async function archiveDepartmentAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = requiredReasonActionSchema.safeParse({ id: formData.get('id'), reason: formData.get('reason') })
  if (!parsed.success) return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors }
  const admin = await requireAdminAction('canManageDepartments')
  if ('error' in admin) return admin.error
  const { error } = await admin.supabase.rpc('archive_club_department', { p_department_id: parsed.data.id, p_reason: parsed.data.reason })
  if (error) return safeActionError()
  return successAction(['/admin/departments'])
}
