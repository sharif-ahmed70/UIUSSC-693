export type ProgressDashboardSummary = {
  active_events: number
  awaiting_approval_events: number
  active_department_assignments: number
  active_tasks: number
  overdue_tasks: number
  blocked_tasks: number
  pending_reviews: number
  revision_requested: number
}

export type EventProgressSummary = {
  operation_id: string
  event_id: string
  event_title: string
  event_date: string
  public_status: string
  operational_status: string
  assigned_department_count: number
  completed_tasks: number
  total_tasks: number
  average_progress: number
  overdue_count: number
  blocked_count: number
  pending_review_count: number
  revision_requested_count: number
  unassigned_count: number
  nearest_deadline: string | null
}

export type DepartmentProgressSummary = {
  assignment_id: string
  event_id: string
  department_id: string
  department_name: string
  is_lead_department: boolean
  assignment_status: string
  responsibility: string
  total_tasks: number
  completed_tasks: number
  completion_percent: number
  average_progress: number
  overdue_count: number
  blocked_count: number
  pending_review_count: number
  revision_requested_count: number
  unassigned_count: number
  next_deadline: string | null
}

export type MyTaskProgressSummary = {
  active_tasks: number
  completed_tasks: number
  ready_to_submit: number
  under_review: number
  revision_requested: number
  overdue_tasks: number
  next_deadline: string | null
}

export type EventProgressReportRow = {
  event_title: string
  event_date: string
  operational_status: string
  department_name: string
  department_role: string
  assignment_status: string
  responsibility: string
  total_tasks: number
  completed_tasks: number
  average_progress: number
  overdue_count: number
  blocked_count: number
  pending_review_count: number
  next_deadline: string | null
}
