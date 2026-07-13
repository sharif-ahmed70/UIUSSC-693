import 'server-only'

import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { canAccessDepartment, hasOperationalOversight } from '@/lib/auth/authorization'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import type {
  BloodAssignmentOverview,
  CommitteeMemberOverview,
  VolunteerAttendanceMember,
  VolunteerDashboardData,
  VolunteerDashboardEvent,
  VolunteerDashboardNotification,
  VolunteerDashboardTask,
  VolunteerMetrics,
} from './types'

type UntypedSupabase = {
  rpc: (name: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string; code?: string } | null }>
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: unknown; error: unknown }>
        order?: never
      }
      order: (column: string, options?: { ascending?: boolean }) => {
        limit: (limit: number) => Promise<{ data: unknown; error: unknown }>
      }
    }
  }
}

function logDashboardError(context: string, error: { message?: string; code?: string } | null){
  if(error){
    console.error('[volunteer-dashboard]', context, { code: error.code ?? 'unknown' })
  }
}

function toEvent(row: Record<string, unknown>): VolunteerDashboardEvent {
  return {
    attendanceEventId: (row.event_id as string | null) ?? null,
    departmentId: '',
    departmentName: 'Volunteer Department',
    eventId: (row.event_id as string | null) ?? null,
    title: row.name as string,
    eventDate: row.event_date as string,
    eventKind: 'meeting',
    location: (row.location as string | null) ?? null,
    status: row.status as string,
    source: 'volunteer_event',
  }
}

function toMember(row: Record<string, unknown>): VolunteerAttendanceMember {
  const present = row.present as boolean | null
  return {
    attendanceRecordId: null,
    volunteerProfileId: row.member_id as string,
    serialNumber: Number(row.serial ?? 0),
    pictureUrl: (row.picture as string | null) ?? null,
    fullName: row.full_name as string,
    studentId: (row.student_id as string | null) ?? null,
    memberType: row.member_type === 'Panel' ? 'Panel' : 'General',
    attendanceStatus: present === true ? 'present' : present === false ? 'absent' : 'unmarked',
    remarks: (row.remarks as string | null) ?? null,
    timeSlot: (row.time_slot as string | null) ?? null,
    updatedAt: (row.updated_at as string | null) ?? null,
    boothRecords: [],
  }
}

function emptyMetrics(): VolunteerMetrics {
  return {
    totalMembers: 0,
    presentCount: 0,
    absentCount: 0,
    unmarkedCount: 0,
    mostActiveMember: null,
    mostActiveMemberId: null,
    mostIrregularMember: null,
    mostIrregularMemberId: null,
  }
}

function toMetrics(row: Record<string, unknown> | null): VolunteerMetrics {
  if(!row) return emptyMetrics()

  return {
    totalMembers: Number(row.total_members ?? 0),
    presentCount: Number(row.present_count ?? 0),
    absentCount: Number(row.absent_count ?? 0),
    unmarkedCount: Number(row.unmarked_count ?? 0),
    mostActiveMember: (row.most_active_member as string | null) ?? null,
    mostActiveMemberId: (row.most_active_member_id as string | null) ?? null,
    mostIrregularMember: (row.most_irregular_member as string | null) ?? null,
    mostIrregularMemberId: (row.most_irregular_member_id as string | null) ?? null,
  }
}

function toTask(row: Record<string, unknown>): VolunteerDashboardTask {
  return {
    taskId: row.task_id as string,
    taskName: row.task_name as string,
    assignedTo: row.assigned_to as string,
    status: row.status as string,
    priority: row.priority as string,
    progressPercent: Number(row.progress_percent ?? 0),
    deadline: (row.deadline as string | null) ?? null,
  }
}

function toCommittee(row: Record<string, unknown>): CommitteeMemberOverview {
  return {
    committeeId: row.committee_id as string,
    committeeName: row.committee_name as string,
    sessionLabel: row.session_label as string,
    committeeStatus: row.committee_status as string,
    memberName: row.member_name as string,
    positionName: row.position_name as string,
    memberStatus: row.member_status as string,
    startDate: (row.start_date as string | null) ?? null,
    endDate: (row.end_date as string | null) ?? null,
  }
}

function toBlood(row: Record<string, unknown>): BloodAssignmentOverview {
  return {
    assignmentId: row.assignment_id as string,
    requestId: row.request_id as string,
    actionLabel: (row.action_label as string | null) ?? null,
    assignmentStatus: row.assignment_status as string,
    assignedTo: row.assigned_to as string,
    bloodGroup: row.blood_group as string,
    hospitalName: row.hospital_name as string,
    neededAt: row.needed_at as string,
    dueAt: (row.due_at as string | null) ?? null,
  }
}

function toNotification(row: Record<string, unknown>): VolunteerDashboardNotification {
  return {
    id: row.id as string,
    title: row.title as string,
    body: row.message as string,
    category: row.category as string,
    severity: row.priority as string,
    targetUrl: (row.action_url as string | null) ?? null,
    createdAt: row.created_at as string,
  }
}

export async function getVolunteerDashboardData({
  eventId,
  attendanceType = 'meeting',
}: {
  eventId?: string | null
  attendanceType?: 'meeting' | 'booth'
}): Promise<VolunteerDashboardData> {
  const [access, supabase] = await Promise.all([
    getStaffAccessContext(),
    createServerSupabaseClient(),
  ])
  const untyped = supabase as unknown as UntypedSupabase

  const { data: departmentData } = await supabase
    .from('club_departments')
    .select('id,name,slug')
    .eq('slug', 'volunteer-management')
    .maybeSingle()

  const department = departmentData ?? access.approvedMemberships.find((membership) => membership.department.slug === 'volunteer-management')?.department ?? access.primaryMembership?.department

  if(!department || !canAccessDepartment(access, department.slug)){
    notFound()
  }

  const membership = access.approvedMemberships.find((item) => item.department.id === department.id)
  const canManageAttendance =
    hasOperationalOversight(access) ||
    Boolean(membership && ['department_head', 'deputy_head'].includes(membership.role))

  const { data: eventsData, error: eventsError } = await untyped.rpc('fetch_volunteer_events')
  logDashboardError('fetch_volunteer_events', eventsError)
  const events = ((eventsData ?? []) as Record<string, unknown>[]).map(toEvent)
  const selectedEvent = events.find((event) => event.eventId === eventId) ?? events[0] ?? null

  const selectedVolunteerEventId = selectedEvent?.eventId ?? null

  const [membersResult, metricsResult, tasksResult, committeeResult, bloodResult, notificationsResult] = await Promise.all([
    selectedVolunteerEventId ? untyped.rpc('fetch_event_members', { event_id: selectedVolunteerEventId, attendance_type: attendanceType }) : Promise.resolve({ data: [], error: null }),
    selectedVolunteerEventId ? untyped.rpc('fetch_attendance_metrics', { event_id: selectedVolunteerEventId }) : Promise.resolve({ data: [], error: null }),
    Promise.resolve({ data: [], error: null }),
    untyped.rpc('get_committee_members', { p_department_id: department.id }),
    untyped.rpc('get_blood_assignments', { p_department_id: department.id }),
    untyped
      .from('notifications')
      .select('id,title,message,category,priority,action_url,created_at')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  logDashboardError('fetch_event_members', membersResult.error)
  logDashboardError('fetch_attendance_metrics', metricsResult.error)
  logDashboardError('get_event_tasks', tasksResult.error)
  logDashboardError('get_committee_members', committeeResult.error)
  logDashboardError('get_blood_assignments', bloodResult.error)

  const metricsRows = (metricsResult.data ?? []) as Record<string, unknown>[]

  return {
    department,
    canManageAttendance,
    events,
    selectedEvent,
    members: ((membersResult.data ?? []) as Record<string, unknown>[]).map(toMember),
    metrics: toMetrics(metricsRows[0] ?? null),
    tasks: ((tasksResult.data ?? []) as Record<string, unknown>[]).map(toTask),
    committeeMembers: ((committeeResult.data ?? []) as Record<string, unknown>[]).map(toCommittee),
    bloodAssignments: ((bloodResult.data ?? []) as Record<string, unknown>[]).map(toBlood),
    notifications: ((notificationsResult.data ?? []) as Record<string, unknown>[]).map(toNotification),
  }
}
