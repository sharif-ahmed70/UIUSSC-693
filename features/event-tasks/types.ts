export type EventTaskPriority = 'low' | 'normal' | 'high' | 'urgent'
export type EventTaskStatus = 'draft' | 'assigned' | 'in_progress' | 'blocked' | 'ready_for_review' | 'completed' | 'cancelled'
export type EventTaskAssignmentRole = 'primary' | 'contributor'
export type EventTaskAssigneeStatus = 'active' | 'revoked' | 'completed'

export type EventTaskSummary = {
  id: string
  eventId: string
  eventTitle: string
  eventDate: string
  departmentId: string
  departmentName: string
  assignmentId: string
  assignmentTitle: string
  title: string
  description: string
  priority: EventTaskPriority
  status: EventTaskStatus
  progressPercent: number
  dueAt: string | null
  primaryAssigneeName: string | null
  contributorCount: number
}

export type EventTaskAssignee = {
  id: string
  profileId: string
  fullName: string
  email: string | null
  role: EventTaskAssignmentRole
  status: EventTaskAssigneeStatus
}

export type EventTaskHistory = {
  id: string
  previousStatus: string | null
  newStatus: string
  previousProgress: number | null
  newProgress: number | null
  reason: string | null
  changedAt: string
}

export type EventTaskDetail = EventTaskSummary & {
  assignees: EventTaskAssignee[]
  history: EventTaskHistory[]
}

export type EligibleTaskMember = {
  profileId: string
  fullName: string
  email: string | null
  role: string
}

export type EligibleTaskAssignment = {
  id: string
  departmentName: string
  assignmentTitle: string
  responsibilityBrief: string
  assignmentStatus: string
}

export type StaffTaskSummary = EventTaskSummary & {
  canSelfUpdate: boolean
}
