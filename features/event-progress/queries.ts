import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { DepartmentProgressSummary, EventProgressReportRow, EventProgressSummary, MyTaskProgressSummary, ProgressDashboardSummary } from './types'

function firstRow<T>(data: T[] | T | null): T | null{
  return Array.isArray(data) ? (data[0] ?? null) : data
}

export async function getOperationalEventDashboard(): Promise<ProgressDashboardSummary>{
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.rpc('get_operational_event_dashboard')
  return firstRow(data as ProgressDashboardSummary[] | null) ?? {
    active_events: 0,
    awaiting_approval_events: 0,
    active_department_assignments: 0,
    active_tasks: 0,
    overdue_tasks: 0,
    blocked_tasks: 0,
    pending_reviews: 0,
    revision_requested: 0,
  }
}

export async function getEventProgressSummaries(): Promise<EventProgressSummary[]>{
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.rpc('get_event_progress_summary')
  return (data ?? []) as EventProgressSummary[]
}

export async function getEventDepartmentProgress(operationId: string): Promise<DepartmentProgressSummary[]>{
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.rpc('get_event_department_progress', { p_operation_id: operationId })
  return (data ?? []) as DepartmentProgressSummary[]
}

export async function getMyTaskProgressSummary(): Promise<MyTaskProgressSummary>{
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.rpc('get_my_task_progress_summary')
  return firstRow(data as MyTaskProgressSummary[] | null) ?? {
    active_tasks: 0,
    completed_tasks: 0,
    ready_to_submit: 0,
    under_review: 0,
    revision_requested: 0,
    overdue_tasks: 0,
    next_deadline: null,
  }
}

export async function getEventProgressReportRows(): Promise<EventProgressReportRow[]>{
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.rpc('get_event_progress_report_rows')
  return (data ?? []) as EventProgressReportRow[]
}
