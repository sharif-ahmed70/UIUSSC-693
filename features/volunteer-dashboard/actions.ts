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

function dashboardPath(eventId?: string | null, attendanceType = 'meeting'){
  return eventId ? `/staff/volunteer/dashboard?module=attendance&attendanceType=${attendanceType}&eventId=${eventId}` : '/staff/volunteer/dashboard?module=attendance'
}

export async function createVolunteerAttendanceEventAction(formData: FormData){
  const departmentId = emptyToNull(formData.get('departmentId'))
  const title = emptyToNull(formData.get('title'))
  const eventDate = emptyToNull(formData.get('eventDate'))
  const attendanceType = emptyToNull(formData.get('attendanceType')) ?? 'meeting'

  if(!departmentId || !title){
    redirect('/staff/volunteer/dashboard?message=event-required')
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await (supabase.rpc as unknown as (
    name: string,
    args: Record<string, unknown>
  ) => Promise<{ data: Array<{ event_id: string }> | null; error: { message?: string } | null }>)('create_missing_event', {
    name: title,
    date: eventDate,
  })

  if(error || !data?.[0]?.event_id){
    redirect('/staff/volunteer/dashboard?message=event-failed')
  }

  revalidatePath('/staff/volunteer/dashboard')
  redirect(dashboardPath(data[0].event_id, attendanceType))
}

export async function submitVolunteerAttendanceAction(_state: VolunteerDashboardActionState, formData: FormData): Promise<VolunteerDashboardActionState>{
  const eventId = emptyToNull(formData.get('eventId'))
  const attendanceType = emptyToNull(formData.get('attendanceType')) ?? 'meeting'
  const recordsRaw = emptyToNull(formData.get('records'))

  if(!eventId || !recordsRaw){
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
  ) => Promise<{ data: Array<{ saved_count: number }> | null; error: { message?: string } | null }>)('save_attendance', {
    event_id: eventId,
    attendance_type: attendanceType,
    attendance_data: records,
  })

  if(error){
    return { status: 'error', message: error.message ?? 'Attendance could not be saved.' }
  }

  revalidatePath('/staff/volunteer/dashboard')
  return { status: 'success', message: `${data?.[0]?.saved_count ?? 0} attendance record(s) saved.` }
}
