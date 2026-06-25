export type EventOperationStatus =
  | 'draft'
  | 'planning'
  | 'awaiting_approval'
  | 'approved'
  | 'published'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'archived'

export type EventAssignmentStatus =
  | 'assigned'
  | 'acknowledged'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'cancelled'

export type AdminEventOperationSummary = {
  id: string
  eventId: string
  title: string
  slug: string
  category: string
  eventDate: string
  location: string
  publicStatus: string
  registrationOpen: boolean
  operationalStatus: EventOperationStatus
  assignedDepartmentCount: number
  leadDepartmentName: string | null
  progressLabel: string
}

export type AdminEventOperationDetail = AdminEventOperationSummary & {
  summary: string
  description: string
  volunteerRequirements: string | null
  internalSummary: string | null
  planningStartAt: string | null
  operationalDeadline: string | null
  cancellationReason: string | null
  assignments: EventDepartmentAssignment[]
  history: EventOperationHistory[]
}

export type EventDepartmentAssignment = {
  id: string
  departmentId: string
  departmentName: string
  departmentSlug: string
  isLeadDepartment: boolean
  assignmentTitle: string
  responsibilityBrief: string
  assignmentStatus: EventAssignmentStatus
  dueAt: string | null
  leadProfileName: string | null
  taskCount: number
  completedTaskCount: number
  blockedTaskCount: number
}

export type EventOperationHistory = {
  id: string
  previousStatus: string | null
  newStatus: string
  reason: string | null
  changedAt: string
}

export type StaffAssignedEvent = EventDepartmentAssignment & {
  eventTitle: string
  eventDate: string
  eventLocation: string
  operationalStatus: EventOperationStatus
}
