import { NextResponse } from 'next/server'
import { buildEventProgressCsv } from '@/features/event-progress/csv'
import { getEventProgressReportRows } from '@/features/event-progress/queries'
import { getAdminContext } from '@/features/admin/queries/getAdminContext'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(){
  const context = await getAdminContext()
  if (!context.permissions.canManageEvents) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const rows = await getEventProgressReportRows()
  const supabase = await createServerSupabaseClient()
  await supabase.rpc('write_club_audit_log', {
    p_action: 'reports.export_event_progress_csv',
    p_entity_type: 'event_progress_report',
    p_entity_id: null,
    p_department_id: null,
    p_metadata: { report_type: 'event_progress', row_count: rows.length },
  } as never)

  return new NextResponse(buildEventProgressCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="uiussc-event-progress.csv"',
      'Cache-Control': 'no-store',
    },
  })
}
