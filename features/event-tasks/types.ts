export type EventTaskPriority = 'low' | 'normal' | 'high' | 'urgent'
export type EventTaskStatus = 'draft' | 'assigned' | 'in_progress' | 'blocked' | 'ready_for_review' | 'completed' | 'cancelled'
export type EventTaskAssignmentRole = 'primary' | 'contributor'
export type EventTaskAssigneeStatus = 'active' | 'revoked' | 'completed'
export type EventTaskSubmissionStatus = 'submitted' | 'under_review' | 'revision_requested' | 'approved' | 'withdrawn' | 'superseded'
export type EventTaskEvidenceType = 'document' | 'design' | 'spreadsheet' | 'presentation' | 'photo' | 'video' | 'folder' | 'other'

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
  latestSubmissionStatus: EventTaskSubmissionStatus | null
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
  operationId: string | null
  assignees: EventTaskAssignee[]
  history: EventTaskHistory[]
  submissions: EventTaskSubmission[]
  hasActionableSubmission: boolean
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

export type EventTaskEvidenceLink = {
  id: string
  evidenceType: EventTaskEvidenceType
  label: string
  url: string
}

export type EventTaskSubmission = {
  id: string
  taskId: string
  submissionNumber: number
  submittedBy: string
  submitterName: string | null
  status: EventTaskSubmissionStatus
  summary: string
  completionNote: string | null
  submittedAt: string
  reviewerName: string | null
  reviewedAt: string | null
  reviewNote: string | null
  evidenceLinks: EventTaskEvidenceLink[]
}
