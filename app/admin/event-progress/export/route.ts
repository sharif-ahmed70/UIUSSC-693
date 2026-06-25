import { NextRequest, NextResponse } from 'next/server'
import { buildEventProgressCsv, buildEventTaskProgressCsv } from '@/features/event-progress/csv'
import { getEventProgressReportRows, getEventTaskProgressReportRows } from '@/features/event-progress/queries'
import type { EventProgressFilters } from '@/features/event-progress/types'
import { getAdminContext } from '@/features/admin/queries/getAdminContext'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type ReportType = 'event' | 'tasks'

function parseFilters(searchParams: URLSearchParams): EventProgressFilters{
  const timeframe = searchParams.get('timeframe')
  const risk = searchParams.get('risk')
  return {
    status: searchParams.get('status') || null,
    timeframe: timeframe === 'upcoming' || timeframe === 'past' ? timeframe : null,
    departmentId: searchParams.get('departmentId') || null,
    risk: risk === 'overdue' || risk === 'blocked' || risk === 'pending_review' || risk === 'revision_requested' ? risk : null,
    limit: 500,
  }
}

function safeFilterSummary(filters: EventProgressFilters){
  return {
    status: filters.status ?? null,
    timeframe: filters.timeframe ?? null,
    department_filter: filters.departmentId ? 'selected' : null,
    risk: filters.risk ?? null,
  }
}

export async function GET(request: NextRequest){
  const context = await getAdminContext()
  if (!context.permissions.canManageEvents) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const report = request.nextUrl.searchParams.get('report') === 'tasks' ? 'tasks' : 'event'
  const filters = parseFilters(request.nextUrl.searchParams)
  const taskRows = report === 'tasks' ? await getEventTaskProgressReportRows(filters) : null
  const eventRows = report === 'event' ? await getEventProgressReportRows(filters) : null
  const rows = taskRows ?? eventRows ?? []
  const csv = taskRows ? buildEventTaskProgressCsv(taskRows) : buildEventProgressCsv(eventRows ?? [])

  const supabase = await createServerSupabaseClient()
  await supabase.rpc('write_club_audit_log', {
    p_action: report === 'tasks' ? 'reports.export_event_task_progress_csv' : 'reports.export_event_progress_csv',
    p_entity_type: 'event_progress_report',
    p_entity_id: null,
    p_department_id: null,
    p_metadata: {
      report_type: report satisfies ReportType,
      filters: safeFilterSummary(filters),
      authorized_scope: context.permissions.canManageEvents ? 'admin_events' : 'none',
      row_count: rows.length,
    },
  } as never)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${report === 'tasks' ? 'uiussc-event-task-progress.csv' : 'uiussc-event-progress.csv'}"`,
      'Cache-Control': 'no-store',
    },
  })
}
