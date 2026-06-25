import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type {
  DepartmentProgressSummary,
  EventProgressFilters,
  EventProgressReportRow,
  EventProgressSummary,
  EventTaskProgressReportRow,
  EventTaskRiskRow,
  MyTaskProgressSummary,
  ProgressDashboardSummary,
  ProgressFilterDepartment,
} from './types'

type ProgressRpcError = {
  message?: string
  code?: string
}

function firstRow<T>(data: T[] | T | null): T | null{
  return Array.isArray(data) ? (data[0] ?? null) : data
}

function logProgressError(context: string, error: ProgressRpcError){
  console.error('[event-progress]', context, { code: error.code ?? 'unknown' })
}

function assertNoError(context: string, error: ProgressRpcError | null){
  if (!error) return
  logProgressError(context, error)
  throw new Error('Unable to load event progress data.')
}

function normalizeFilters(filters: EventProgressFilters = {}){
  return {
    p_status: filters.status || undefined,
    p_timeframe: filters.timeframe || undefined,
    p_department_id: filters.departmentId || undefined,
    p_risk: filters.risk || undefined,
  }
}

function normalizePagedFilters(filters: EventProgressFilters = {}){
  return {
    ...normalizeFilters(filters),
    p_limit: Math.min(Math.max(filters.limit ?? 50, 1), 100),
    p_offset: Math.max(filters.offset ?? 0, 0),
  }
}

export async function getOperationalEventDashboard(filters: EventProgressFilters = {}): Promise<ProgressDashboardSummary>{
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('get_operational_event_dashboard', normalizeFilters(filters))
  assertNoError('get_operational_event_dashboard', error)
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

export async function getEventProgressSummaries(filters: EventProgressFilters = {}): Promise<EventProgressSummary[]>{
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('get_event_progress_summary', normalizePagedFilters(filters))
  assertNoError('get_event_progress_summary', error)
  return (data ?? []) as EventProgressSummary[]
}

export async function getSingleEventProgressSummary(operationId: string): Promise<EventProgressSummary | null>{
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('get_single_event_progress_summary', { p_operation_id: operationId })
  assertNoError('get_single_event_progress_summary', error)
  return firstRow((data ?? []) as EventProgressSummary[])
}

export async function getEventDepartmentProgress(operationId: string): Promise<DepartmentProgressSummary[]>{
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('get_event_department_progress', { p_operation_id: operationId })
  assertNoError('get_event_department_progress', error)
  return (data ?? []) as DepartmentProgressSummary[]
}

export async function getMyTaskProgressSummary(): Promise<MyTaskProgressSummary>{
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('get_my_task_progress_summary')
  assertNoError('get_my_task_progress_summary', error)
  return firstRow(data as MyTaskProgressSummary[] | null) ?? {
    scope_kind: 'personal',
    assigned_events: 0,
    total_tasks: 0,
    active_tasks: 0,
    completed_tasks: 0,
    ready_to_submit: 0,
    under_review: 0,
    revision_requested: 0,
    overdue_tasks: 0,
    blocked_tasks: 0,
    unassigned_tasks: 0,
    average_progress: 0,
    next_deadline: null,
  }
}

export async function getEventProgressReportRows(filters: EventProgressFilters = {}): Promise<EventProgressReportRow[]>{
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('get_event_progress_report_rows', {
    ...normalizeFilters(filters),
    p_limit: Math.min(Math.max(filters.limit ?? 500, 1), 500),
  })
  assertNoError('get_event_progress_report_rows', error)
  return (data ?? []) as EventProgressReportRow[]
}

export async function getEventTaskProgressReportRows(filters: EventProgressFilters & { operationId?: string | null } = {}): Promise<EventTaskProgressReportRow[]>{
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('get_event_task_progress_report_rows', {
    ...normalizeFilters(filters),
    p_operation_id: filters.operationId || undefined,
    p_limit: Math.min(Math.max(filters.limit ?? 500, 1), 500),
  })
  assertNoError('get_event_task_progress_report_rows', error)
  return (data ?? []) as EventTaskProgressReportRow[]
}

export async function getEventTaskRiskRows(operationId: string, risk: NonNullable<EventProgressFilters['risk']>, limit = 10): Promise<EventTaskRiskRow[]>{
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('get_event_task_risk_rows', {
    p_operation_id: operationId,
    p_risk: risk,
    p_limit: Math.min(Math.max(limit, 1), 25),
  })
  assertNoError('get_event_task_risk_rows', error)
  return (data ?? []) as EventTaskRiskRow[]
}

export async function getProgressFilterDepartments(): Promise<ProgressFilterDepartment[]>{
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('club_departments')
    .select('id,name')
    .eq('status', 'active')
    .is('archived_at', null)
    .order('display_order', { ascending: true })
  assertNoError('club_departments progress filters', error)
  return (data ?? []) as ProgressFilterDepartment[]
}
