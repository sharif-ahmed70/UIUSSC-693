'use server'

import type { AdminActionState } from '@/features/admin/types'
import { requireAdminAction, safeActionError, successAction } from '@/features/admin/actions/actionUtils'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import { assignDepartmentSchema, changeAssignmentStatusSchema, changeEventStatusSchema, createClubEventSchema, updateEventOperationSchema } from './schemas'

function emptyToNull(value: string | null | undefined){
  return value && value.length > 0 ? value : null
}

export async function createClubEventAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = createClubEventSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please review the event fields.', fieldErrors: parsed.error.flatten().fieldErrors }

  const admin = await requireAdminAction('canManageEvents')
  if ('error' in admin) return admin.error

  const { error } = await admin.supabase.rpc('create_club_event', {
    p_title: parsed.data.title,
    p_slug: parsed.data.slug,
    p_summary: parsed.data.summary,
    p_description: parsed.data.description,
    p_category: parsed.data.category,
    p_event_date: parsed.data.eventDate,
    p_location: parsed.data.location,
    p_start_time: emptyToNull(parsed.data.startTime),
    p_end_time: emptyToNull(parsed.data.endTime),
    p_capacity: parsed.data.capacity ? Number(parsed.data.capacity) : null,
    p_registration_open: false,
    p_volunteer_requirements: emptyToNull(parsed.data.volunteerRequirements),
    p_internal_summary: emptyToNull(parsed.data.internalSummary),
  } as unknown as Database['public']['Functions']['create_club_event']['Args'])

  if (error) return safeActionError()
  return successAction(['/admin/events'])
}

export async function updateEventOperationAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = updateEventOperationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please review the operation fields.', fieldErrors: parsed.error.flatten().fieldErrors }

  const admin = await requireAdminAction('canManageEvents')
  if ('error' in admin) return admin.error

  const { error } = await admin.supabase.rpc('update_club_event_operation', {
    p_operation_id: parsed.data.id,
    p_internal_summary: emptyToNull(parsed.data.internalSummary),
    p_planning_start_at: parsed.data.planningStartAt,
    p_operational_deadline: parsed.data.operationalDeadline,
    p_owner_profile_id: null,
  } as unknown as Database['public']['Functions']['update_club_event_operation']['Args'])

  if (error) return safeActionError()
  return successAction(['/admin/events', `/admin/events/${parsed.data.id}`])
}

export async function changeEventStatusAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = changeEventStatusSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please review the status action.', fieldErrors: parsed.error.flatten().fieldErrors }

  const admin = await requireAdminAction('canManageEvents')
  if ('error' in admin) return admin.error

  const rpcName = parsed.data.status === 'published' ? 'publish_club_event' : parsed.data.status === 'completed' ? 'complete_club_event' : parsed.data.status === 'cancelled' ? 'request_club_event_cancellation' : 'change_club_event_operational_status'
  const args =
    rpcName === 'change_club_event_operational_status'
      ? { p_operation_id: parsed.data.id, p_status: parsed.data.status, p_reason: emptyToNull(parsed.data.reason) }
      : { p_operation_id: parsed.data.id, p_reason: emptyToNull(parsed.data.reason) }

  const { error } = await admin.supabase.rpc(rpcName, args as never)

  if (error) return safeActionError()
  return successAction(['/admin/events', `/admin/events/${parsed.data.id}`, '/admin/approval-requests'])
}

export async function assignDepartmentAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = assignDepartmentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please review the assignment fields.', fieldErrors: parsed.error.flatten().fieldErrors }

  const admin = await requireAdminAction('canManageEvents')
  if ('error' in admin) return admin.error

  const { error } = await admin.supabase.rpc('assign_event_department', {
    p_operation_id: parsed.data.id,
    p_department_id: parsed.data.departmentId,
    p_is_lead_department: parsed.data.isLeadDepartment === 'yes',
    p_assignment_title: parsed.data.assignmentTitle,
    p_responsibility_brief: parsed.data.responsibilityBrief,
    p_due_at: parsed.data.dueAt,
    p_lead_profile_id: null,
  } as unknown as Database['public']['Functions']['assign_event_department']['Args'])

  if (error) return safeActionError()
  return successAction(['/admin/events', `/admin/events/${parsed.data.id}`, '/staff/assigned-events'])
}

export async function changeAssignmentStatusAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = changeAssignmentStatusSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please review the assignment status.', fieldErrors: parsed.error.flatten().fieldErrors }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('change_event_department_assignment_status', {
    p_assignment_id: parsed.data.id,
    p_status: parsed.data.status,
    p_reason: emptyToNull(parsed.data.reason),
  } as unknown as Database['public']['Functions']['change_event_department_assignment_status']['Args'])

  if (error) return safeActionError()
  return successAction(['/admin/events', '/staff/assigned-events'])
}
