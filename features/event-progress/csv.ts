import type { EventProgressReportRow, EventTaskProgressReportRow } from './types'

function escapeCell(value: string | number | boolean | null | undefined){
  const text = value == null ? '' : String(value)
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safe.replaceAll('"', '""')}"`
}

function buildCsv(headers: string[], rows: Array<Array<string | number | boolean | null | undefined>>){
  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ]

  return `\uFEFF${lines.join('\r\n')}`
}

export function buildEventProgressCsv(rows: EventProgressReportRow[]){
  return buildCsv(
    [
      'Event',
      'Date',
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
    ],
    rows.map((row) => [
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
    ]),
  )
}

export function buildEventTaskProgressCsv(rows: EventTaskProgressReportRow[]){
  return buildCsv(
    [
      'Event',
      'Department',
      'Task title',
      'Priority',
      'Status',
      'Progress',
      'Due date',
      'Overdue',
      'Assigned state',
      'Latest submission status',
    ],
    rows.map((row) => [
      row.event_title,
      row.department_name,
      row.task_title,
      row.priority,
      row.task_status,
      row.progress_percent,
      row.due_at,
      row.is_overdue ? 'yes' : 'no',
      row.assignment_state,
      row.latest_submission_status,
    ]),
  )
}
