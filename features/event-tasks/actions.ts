'use server'

import type { AdminActionState } from '@/features/admin/types'
import { requireAdminAction, safeActionError, successAction } from '@/features/admin/actions/actionUtils'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import { assignTaskMemberSchema, cancelTaskSchema, changeTaskStatusSchema, closeTaskSchema, createEventTaskSchema, revokeTaskMemberSchema, updateEventTaskSchema, updateTaskProgressSchema } from './schemas'

function emptyToNull(value: string | null | undefined){
  return value && value.length > 0 ? value : null
}

export async function createEventTaskAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = createEventTaskSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please review the task fields.', fieldErrors: parsed.error.flatten().fieldErrors }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('create_event_department_task', {
    p_event_department_assignment_id: parsed.data.eventDepartmentAssignmentId,
    p_title: parsed.data.title,
    p_description: parsed.data.description,
    p_priority: parsed.data.priority,
    p_due_at: parsed.data.dueAt,
  } as unknown as Database['public']['Functions']['create_event_department_task']['Args'])

  if (error) return safeActionError()
  return successAction(['/admin/events', '/staff/tasks'])
}

export async function updateEventTaskAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = updateEventTaskSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please review the task fields.', fieldErrors: parsed.error.flatten().fieldErrors }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('update_event_department_task', {
    p_task_id: parsed.data.id,
    p_title: parsed.data.title,
    p_description: parsed.data.description,
    p_priority: parsed.data.priority,
    p_due_at: parsed.data.dueAt,
  } as unknown as Database['public']['Functions']['update_event_department_task']['Args'])

  if (error) return safeActionError()
  return successAction(['/admin/events', `/admin/events/${parsed.data.id}`, '/staff/tasks'])
}

export async function assignTaskMemberAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = assignTaskMemberSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please review the assignee fields.', fieldErrors: parsed.error.flatten().fieldErrors }

  const admin = await requireAdminAction('canManageEvents')
  const supabase = 'error' in admin ? await createServerSupabaseClient() : admin.supabase
  const { error } = await supabase.rpc('assign_event_task_member', {
    p_task_id: parsed.data.id,
    p_volunteer_profile_id: parsed.data.volunteerProfileId,
    p_assignment_role: parsed.data.assignmentRole,
  } as unknown as Database['public']['Functions']['assign_event_task_member']['Args'])

  if (error) return safeActionError()
  return successAction(['/admin/events', `/staff/tasks/${parsed.data.id}`])
}

export async function revokeTaskMemberAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = revokeTaskMemberSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please review the revocation reason.', fieldErrors: parsed.error.flatten().fieldErrors }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('revoke_event_task_member', {
    p_task_assignee_id: parsed.data.id,
    p_reason: parsed.data.reason,
  } as unknown as Database['public']['Functions']['revoke_event_task_member']['Args'])

  if (error) return safeActionError()
  return successAction(['/admin/events', '/staff/tasks'])
}

export async function updateTaskProgressAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = updateTaskProgressSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please review the progress value.', fieldErrors: parsed.error.flatten().fieldErrors }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('update_own_event_task_progress', {
    p_task_id: parsed.data.id,
    p_progress_percent: parsed.data.progressPercent,
    p_reason: emptyToNull(parsed.data.reason),
  } as unknown as Database['public']['Functions']['update_own_event_task_progress']['Args'])

  if (error) return safeActionError()
  return successAction(['/staff/tasks', `/staff/tasks/${parsed.data.id}`])
}

export async function changeTaskStatusAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = changeTaskStatusSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please review the status change.', fieldErrors: parsed.error.flatten().fieldErrors }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('change_event_task_status', {
    p_task_id: parsed.data.id,
    p_status: parsed.data.status,
    p_reason: emptyToNull(parsed.data.reason),
  } as unknown as Database['public']['Functions']['change_event_task_status']['Args'])

  if (error) return safeActionError()
  return successAction(['/staff/tasks', `/staff/tasks/${parsed.data.id}`, '/admin/events'])
}

export async function completeTaskAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = closeTaskSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please review the completion request.', fieldErrors: parsed.error.flatten().fieldErrors }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('complete_event_department_task', {
    p_task_id: parsed.data.id,
    p_reason: emptyToNull(parsed.data.reason),
  } as unknown as Database['public']['Functions']['complete_event_department_task']['Args'])

  if (error) return safeActionError()
  return successAction(['/admin/events', '/staff/tasks'])
}

export async function cancelTaskAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = cancelTaskSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please review the cancellation reason.', fieldErrors: parsed.error.flatten().fieldErrors }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('cancel_event_department_task', {
    p_task_id: parsed.data.id,
    p_reason: parsed.data.reason,
  } as unknown as Database['public']['Functions']['cancel_event_department_task']['Args'])

  if (error) return safeActionError()
  return successAction(['/admin/events', '/staff/tasks'])
}
