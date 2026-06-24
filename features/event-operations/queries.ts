import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { AdminEventOperationDetail, AdminEventOperationSummary, EventDepartmentAssignment, EventOperationHistory, StaffAssignedEvent } from './types'

type OperationRow = {
  id: string
  event_id: string
  operational_status: AdminEventOperationSummary['operationalStatus']
  internal_summary: string | null
  planning_start_at: string | null
  operational_deadline: string | null
  cancellation_reason: string | null
  events: {
    id: string
    title: string
    slug: string
    summary: string
    description: string
    category: string
    event_date: string
    location: string
    status: string
    registration_open: boolean
    volunteer_requirements: string | null
  } | null
}

type AssignmentRow = {
  id: string
  event_id: string
  department_id: string
  is_lead_department: boolean
  assignment_title: string
  responsibility_brief: string
  assignment_status: EventDepartmentAssignment['assignmentStatus']
  due_at: string | null
  club_departments: { name: string | null; slug: string | null } | null
  volunteer_profiles: { full_name: string | null } | null
}

type HistoryRow = {
  id: string
  previous_status: string | null
  new_status: string
  reason: string | null
  changed_at: string
}

function progressLabel(assignments: Pick<EventDepartmentAssignment, 'assignmentStatus'>[]){
  if (assignments.length === 0) return 'No departments assigned'
  const completed = assignments.filter((assignment) => assignment.assignmentStatus === 'completed').length
  return `${completed}/${assignments.length} assignments complete`
}

function mapAssignment(row: AssignmentRow): EventDepartmentAssignment{
  return {
    id: row.id,
    departmentId: row.department_id,
    departmentName: row.club_departments?.name ?? 'Unknown department',
    departmentSlug: row.club_departments?.slug ?? 'unknown',
    isLeadDepartment: row.is_lead_department,
    assignmentTitle: row.assignment_title,
    responsibilityBrief: row.responsibility_brief,
    assignmentStatus: row.assignment_status,
    dueAt: row.due_at,
    leadProfileName: row.volunteer_profiles?.full_name ?? null,
  }
}

function mapSummary(row: OperationRow, assignments: EventDepartmentAssignment[]): AdminEventOperationSummary | null{
  const event = row.events
  if (!event) return null
  const lead = assignments.find((assignment) => assignment.isLeadDepartment && assignment.assignmentStatus !== 'cancelled')
  return {
    id: row.id,
    eventId: row.event_id,
    title: event.title,
    slug: event.slug,
    category: event.category,
    eventDate: event.event_date,
    location: event.location,
    publicStatus: event.status,
    registrationOpen: event.registration_open,
    operationalStatus: row.operational_status,
    assignedDepartmentCount: assignments.filter((assignment) => assignment.assignmentStatus !== 'cancelled').length,
    leadDepartmentName: lead?.departmentName ?? null,
    progressLabel: progressLabel(assignments),
  }
}

export async function getAdminEventOperations(): Promise<AdminEventOperationSummary[]>{
  const supabase = await createServerSupabaseClient()
  const { data: operations } = await supabase
    .from('club_event_operations')
    .select('id,event_id,operational_status,internal_summary,planning_start_at,operational_deadline,cancellation_reason,events(id,title,slug,summary,description,category,event_date,location,status,registration_open,volunteer_requirements)')
    .order('created_at', { ascending: false })

  const operationRows = (operations ?? []) as unknown as OperationRow[]
  const operationIds = operationRows.map((operation) => operation.id)
  const { data: assignments } = operationIds.length
    ? await supabase
        .from('event_department_assignments')
        .select('id,event_id,department_id,is_lead_department,assignment_title,responsibility_brief,assignment_status,due_at,club_departments(name,slug),volunteer_profiles(full_name)')
        .in('operation_id', operationIds)
    : { data: [] }

  const assignmentsByEvent = new Map<string, EventDepartmentAssignment[]>()
  ;((assignments ?? []) as unknown as AssignmentRow[]).forEach((row) => {
    assignmentsByEvent.set(row.event_id, [...(assignmentsByEvent.get(row.event_id) ?? []), mapAssignment(row)])
  })

  return operationRows
    .map((operation) => mapSummary(operation, assignmentsByEvent.get(operation.event_id) ?? []))
    .filter((operation): operation is AdminEventOperationSummary => operation !== null)
}

export async function getAdminEventOperation(operationId: string): Promise<AdminEventOperationDetail | null>{
  const supabase = await createServerSupabaseClient()
  const [{ data: operation }, { data: assignments }, { data: history }] = await Promise.all([
    supabase
      .from('club_event_operations')
      .select('id,event_id,operational_status,internal_summary,planning_start_at,operational_deadline,cancellation_reason,events(id,title,slug,summary,description,category,event_date,location,status,registration_open,volunteer_requirements)')
      .eq('id', operationId)
      .maybeSingle(),
    supabase
      .from('event_department_assignments')
      .select('id,event_id,department_id,is_lead_department,assignment_title,responsibility_brief,assignment_status,due_at,club_departments(name,slug),volunteer_profiles(full_name)')
      .eq('operation_id', operationId)
      .order('assigned_at', { ascending: true }),
    supabase
      .from('club_event_operation_history')
      .select('id,previous_status,new_status,reason,changed_at')
      .eq('operation_id', operationId)
      .order('changed_at', { ascending: false })
      .limit(20),
  ])

  if (!operation) return null
  const assignmentList = ((assignments ?? []) as unknown as AssignmentRow[]).map(mapAssignment)
  const summary = mapSummary(operation as unknown as OperationRow, assignmentList)
  const event = (operation as unknown as OperationRow).events
  if (!summary || !event) return null

  return {
    ...summary,
    summary: event.summary,
    description: event.description,
    volunteerRequirements: event.volunteer_requirements,
    internalSummary: (operation as unknown as OperationRow).internal_summary,
    planningStartAt: (operation as unknown as OperationRow).planning_start_at,
    operationalDeadline: (operation as unknown as OperationRow).operational_deadline,
    cancellationReason: (operation as unknown as OperationRow).cancellation_reason,
    assignments: assignmentList,
    history: ((history ?? []) as HistoryRow[]).map((item) => ({
      id: item.id,
      previousStatus: item.previous_status,
      newStatus: item.new_status,
      reason: item.reason,
      changedAt: item.changed_at,
    })),
  }
}

export async function getActiveDepartmentsForEventAssignments(){
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('club_departments')
    .select('id,name,slug')
    .eq('status', 'active')
    .is('archived_at', null)
    .order('display_order', { ascending: true })

  return data ?? []
}

export async function getStaffAssignedEvents(): Promise<StaffAssignedEvent[]>{
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('event_department_assignments')
    .select('id,event_id,department_id,is_lead_department,assignment_title,responsibility_brief,assignment_status,due_at,club_departments(name,slug),volunteer_profiles(full_name),club_event_operations(operational_status,events(title,event_date,location))')
    .neq('assignment_status', 'cancelled')
    .order('due_at', { ascending: true, nullsFirst: false })

  return ((data ?? []) as unknown as Array<AssignmentRow & { club_event_operations: { operational_status: StaffAssignedEvent['operationalStatus']; events: { title: string; event_date: string; location: string } | null } | null }>).map((row) => {
    const assignment = mapAssignment(row)
    return {
      ...assignment,
      eventTitle: row.club_event_operations?.events?.title ?? 'Untitled event',
      eventDate: row.club_event_operations?.events?.event_date ?? '',
      eventLocation: row.club_event_operations?.events?.location ?? 'Not set',
      operationalStatus: row.club_event_operations?.operational_status ?? 'draft',
    }
  })
}
