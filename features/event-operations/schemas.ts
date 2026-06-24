import { z } from 'zod'

const optionalDateTime = z.string().trim().optional().transform((value) => value || null)

export const createClubEventSchema = z.object({
  title: z.string().trim().min(3).max(160),
  slug: z.string().trim().min(3).max(180),
  summary: z.string().trim().min(10).max(240),
  description: z.string().trim().min(20).max(3000),
  category: z.enum(['Blood Donation', 'Donation Drive', 'Campaign', 'Orientation', 'Workshop', 'Other']),
  eventDate: z.string().trim().min(1),
  startTime: z.string().trim().optional(),
  endTime: z.string().trim().optional(),
  location: z.string().trim().min(3).max(180),
  capacity: z.string().trim().optional(),
  volunteerRequirements: z.string().trim().optional(),
  internalSummary: z.string().trim().optional(),
})

export const updateEventOperationSchema = z.object({
  id: z.uuid(),
  internalSummary: z.string().trim().max(2000).optional(),
  planningStartAt: optionalDateTime,
  operationalDeadline: optionalDateTime,
})

export const changeEventStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(['draft', 'planning', 'awaiting_approval', 'approved', 'published', 'active', 'completed', 'cancelled', 'archived']),
  reason: z.string().trim().max(500).optional(),
})

export const assignDepartmentSchema = z.object({
  id: z.uuid(),
  departmentId: z.uuid(),
  isLeadDepartment: z.enum(['yes', 'no']).optional(),
  assignmentTitle: z.string().trim().min(3).max(160),
  responsibilityBrief: z.string().trim().min(10).max(1000),
  dueAt: optionalDateTime,
})

export const changeAssignmentStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(['assigned', 'acknowledged', 'in_progress', 'blocked', 'completed', 'cancelled']),
  reason: z.string().trim().max(500).optional(),
})
