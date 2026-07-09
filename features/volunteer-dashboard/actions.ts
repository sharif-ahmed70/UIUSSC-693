'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export type VolunteerDashboardActionState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

function emptyToNull(value: FormDataEntryValue | null){
  const text = typeof value === 'string' ? value.trim() : ''
  return text.length > 0 ? text : null
}

function dashboardPath(eventId?: string | null){
  return eventId ? `/staff/volunteer/dashboard?eventId=${eventId}` : '/staff/volunteer/dashboard'
}

export async function createVolunteerAttendanceEventAction(formData: FormData){
  const departmentId = emptyToNull(formData.get('departmentId'))
  const title = emptyToNull(formData.get('title'))
  const eventDate = emptyToNull(formData.get('eventDate'))
  const eventKind = emptyToNull(formData.get('eventKind')) ?? 'meeting'
  const location = emptyToNull(formData.get('location'))
  const sourceEventId = emptyToNull(formData.get('sourceEventId'))

  if(!departmentId || !title){
    redirect('/staff/volunteer/dashboard?message=event-required')
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await (supabase.rpc as unknown as (
    name: string,
    args: Record<string, unknown>
  ) => Promise<{ data: Array<{ attendance_event_id: string }> | null; error: { message?: string } | null }>)('create_volunteer_attendance_event', {
    p_department_id: departmentId,
    p_title: title,
    p_event_date: eventDate,
    p_event_kind: eventKind,
    p_location: location,
    p_event_id: sourceEventId,
  })

  if(error || !data?.[0]?.attendance_event_id){
    redirect('/staff/volunteer/dashboard?message=event-failed')
  }

  revalidatePath('/staff/volunteer/dashboard')
  redirect(dashboardPath(data[0].attendance_event_id))
}

export async function submitVolunteerAttendanceAction(_state: VolunteerDashboardActionState, formData: FormData): Promise<VolunteerDashboardActionState>{
  const attendanceEventId = emptyToNull(formData.get('attendanceEventId'))
  const recordsRaw = emptyToNull(formData.get('records'))

  if(!attendanceEventId || !recordsRaw){
    return { status: 'error', message: 'Select an event and mark at least one attendance record.' }
  }

  let records: unknown
  try {
    records = JSON.parse(recordsRaw)
  } catch {
    return { status: 'error', message: 'Attendance data could not be read.' }
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await (supabase.rpc as unknown as (
    name: string,
    args: Record<string, unknown>
  ) => Promise<{ data: Array<{ saved_count: number }> | null; error: { message?: string } | null }>)('submit_attendance', {
    p_attendance_event_id: attendanceEventId,
    p_records: records,
  })

  if(error){
    return { status: 'error', message: error.message ?? 'Attendance could not be saved.' }
  }

  revalidatePath('/staff/volunteer/dashboard')
  return { status: 'success', message: `${data?.[0]?.saved_count ?? 0} attendance record(s) saved.` }
}
