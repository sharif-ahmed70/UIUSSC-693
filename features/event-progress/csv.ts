import type { EventProgressReportRow } from './types'

function escapeCell(value: string | number | null | undefined){
  const text = value == null ? '' : String(value)
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safe.replaceAll('"', '""')}"`
}

export function buildEventProgressCsv(rows: EventProgressReportRow[]){
  const headers = [
    'Event title',
    'Event date',
    'Operational status',
    'Department',
    'Lead/support',
    'Assignment status',
    'Responsibility',
    'Total tasks',
    'Completed tasks',
    'Average progress',
    'Overdue',
    'Blocked',
    'Pending review',
    'Next deadline',
  ]

  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => [
      row.event_title,
      row.event_date,
      row.operational_status,
      row.department_name,
      row.department_role,
      row.assignment_status,
      row.responsibility,
      row.total_tasks,
      row.completed_tasks,
      row.average_progress,
      row.overdue_count,
      row.blocked_count,
      row.pending_review_count,
      row.next_deadline,
    ].map(escapeCell).join(',')),
  ]

  return `\uFEFF${lines.join('\r\n')}`
}
