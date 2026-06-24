import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { EligibleTaskAssignment, EligibleTaskMember, EventTaskAssignee, EventTaskDetail, EventTaskHistory, EventTaskSummary, StaffTaskSummary } from './types'

type TaskRow = {
  id: string
  event_department_assignment_id: string
  event_id: string
  department_id: string
  title: string
  description: string
  priority: EventTaskSummary['priority']
  task_status: EventTaskSummary['status']
  progress_percent: number
  due_at: string | null
  events: { title: string | null; event_date: string | null } | null
  club_departments: { name: string | null } | null
  event_department_assignments: { assignment_title: string | null; responsibility_brief: string | null; assignment_status: string | null } | null
}

type AssigneeRow = {
  id: string
  task_id: string
  volunteer_profile_id: string
  assignment_role: EventTaskAssignee['role']
  assignment_status: EventTaskAssignee['status']
  volunteer_profiles: { full_name: string | null; email: string | null } | null
}

type HistoryRow = {
  id: string
  previous_status: string | null
  new_status: string
  previous_progress: number | null
  new_progress: number | null
  reason: string | null
  changed_at: string
}

function mapTask(row: TaskRow, assignees: EventTaskAssignee[] = []): EventTaskSummary{
  const primary = assignees.find((assignee) => assignee.status === 'active' && assignee.role === 'primary')
  return {
    id: row.id,
    eventId: row.event_id,
    eventTitle: row.events?.title ?? 'Untitled event',
    eventDate: row.events?.event_date ?? '',
    departmentId: row.department_id,
    departmentName: row.club_departments?.name ?? 'Unknown department',
    assignmentId: row.event_department_assignment_id,
    assignmentTitle: row.event_department_assignments?.assignment_title ?? 'Department responsibility',
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.task_status,
    progressPercent: row.progress_percent,
    dueAt: row.due_at,
    primaryAssigneeName: primary?.fullName ?? null,
    contributorCount: assignees.filter((assignee) => assignee.status === 'active' && assignee.role === 'contributor').length,
  }
}

function mapAssignee(row: AssigneeRow): EventTaskAssignee{
  return {
    id: row.id,
    profileId: row.volunteer_profile_id,
    fullName: row.volunteer_profiles?.full_name ?? 'Unknown member',
    email: row.volunteer_profiles?.email ?? null,
    role: row.assignment_role,
    status: row.assignment_status,
  }
}

async function getTaskAssignees(taskIds: string[]){
  const supabase = await createServerSupabaseClient()
  const { data } = taskIds.length
    ? await supabase
        .from('event_task_assignees')
        .select('id,task_id,volunteer_profile_id,assignment_role,assignment_status,volunteer_profiles(full_name,email)')
        .in('task_id', taskIds)
    : { data: [] }

  const byTask = new Map<string, EventTaskAssignee[]>()
  ;((data ?? []) as unknown as AssigneeRow[]).forEach((row) => {
    byTask.set(row.task_id, [...(byTask.get(row.task_id) ?? []), mapAssignee(row)])
  })
  return byTask
}

export async function getEventTasksForOperation(operationId: string): Promise<EventTaskSummary[]>{
  const supabase = await createServerSupabaseClient()
  const { data: assignments } = await supabase
    .from('event_department_assignments')
    .select('id')
    .eq('operation_id', operationId)

  const assignmentIds = ((assignments ?? []) as { id: string }[]).map((assignment) => assignment.id)
  const { data } = assignmentIds.length
    ? await supabase
        .from('event_department_tasks')
        .select('id,event_department_assignment_id,event_id,department_id,title,description,priority,task_status,progress_percent,due_at,events(title,event_date),club_departments(name),event_department_assignments(assignment_title,responsibility_brief,assignment_status)')
        .in('event_department_assignment_id', assignmentIds)
        .order('due_at', { ascending: true, nullsFirst: false })
    : { data: [] }

  const rows = (data ?? []) as unknown as TaskRow[]
  const assigneesByTask = await getTaskAssignees(rows.map((task) => task.id))
  return rows.map((task) => mapTask(task, assigneesByTask.get(task.id) ?? []))
}

export async function getEventTaskDetail(taskId: string): Promise<EventTaskDetail | null>{
  const supabase = await createServerSupabaseClient()
  const [{ data: task }, assigneesByTask, { data: history }] = await Promise.all([
    supabase
      .from('event_department_tasks')
      .select('id,event_department_assignment_id,event_id,department_id,title,description,priority,task_status,progress_percent,due_at,events(title,event_date),club_departments(name),event_department_assignments(assignment_title,responsibility_brief,assignment_status)')
      .eq('id', taskId)
      .maybeSingle(),
    getTaskAssignees([taskId]),
    supabase
      .from('event_task_status_history')
      .select('id,previous_status,new_status,previous_progress,new_progress,reason,changed_at')
      .eq('task_id', taskId)
      .order('changed_at', { ascending: false })
      .limit(30),
  ])

  if (!task) return null
  const assignees = assigneesByTask.get(taskId) ?? []
  const summary = mapTask(task as unknown as TaskRow, assignees)
  return {
    ...summary,
    assignees,
    history: ((history ?? []) as HistoryRow[]).map((item): EventTaskHistory => ({
      id: item.id,
      previousStatus: item.previous_status,
      newStatus: item.new_status,
      previousProgress: item.previous_progress,
      newProgress: item.new_progress,
      reason: item.reason,
      changedAt: item.changed_at,
    })),
  }
}

export async function getEligibleTaskAssignments(operationId: string): Promise<EligibleTaskAssignment[]>{
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('event_department_assignments')
    .select('id,assignment_title,responsibility_brief,assignment_status,club_departments(name)')
    .eq('operation_id', operationId)
    .neq('assignment_status', 'cancelled')
    .order('assigned_at', { ascending: true })

  return ((data ?? []) as unknown as Array<{ id: string; assignment_title: string; responsibility_brief: string; assignment_status: string; club_departments: { name: string | null } | null }>).map((row) => ({
    id: row.id,
    departmentName: row.club_departments?.name ?? 'Unknown department',
    assignmentTitle: row.assignment_title,
    responsibilityBrief: row.responsibility_brief,
    assignmentStatus: row.assignment_status,
  }))
}

export async function getEligibleTaskMembers(departmentId: string): Promise<EligibleTaskMember[]>{
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('volunteer_department_memberships')
    .select('department_role, volunteer_profiles(id,full_name,email)')
    .eq('department_id', departmentId)
    .eq('membership_status', 'approved')
    .order('department_role', { ascending: true })

  return ((data ?? []) as unknown as Array<{ department_role: string; volunteer_profiles: { id: string; full_name: string; email: string | null } | null }>).flatMap((row) => {
    if (!row.volunteer_profiles) return []
    return [{
      profileId: row.volunteer_profiles.id,
      fullName: row.volunteer_profiles.full_name,
      email: row.volunteer_profiles.email,
      role: row.department_role,
    }]
  })
}

export async function getStaffTasks(): Promise<StaffTaskSummary[]>{
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('event_department_tasks')
    .select('id,event_department_assignment_id,event_id,department_id,title,description,priority,task_status,progress_percent,due_at,events(title,event_date),club_departments(name),event_department_assignments(assignment_title,responsibility_brief,assignment_status)')
    .order('due_at', { ascending: true, nullsFirst: false })

  const rows = (data ?? []) as unknown as TaskRow[]
  const assigneesByTask = await getTaskAssignees(rows.map((task) => task.id))
  return rows.map((task) => ({
    ...mapTask(task, assigneesByTask.get(task.id) ?? []),
    canSelfUpdate: (assigneesByTask.get(task.id) ?? []).some((assignee) => assignee.status === 'active'),
  }))
}
