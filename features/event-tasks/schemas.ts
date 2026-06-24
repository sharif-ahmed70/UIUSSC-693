import { z } from 'zod'

const optionalDateTime = z.string().trim().optional().transform((value) => value || null)

export const createEventTaskSchema = z.object({
  eventDepartmentAssignmentId: z.uuid(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(1500),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  dueAt: optionalDateTime,
})

export const updateEventTaskSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(1500),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  dueAt: optionalDateTime,
})

export const assignTaskMemberSchema = z.object({
  id: z.uuid(),
  volunteerProfileId: z.uuid(),
  assignmentRole: z.enum(['primary', 'contributor']),
})

export const revokeTaskMemberSchema = z.object({
  id: z.uuid(),
  reason: z.string().trim().min(3).max(500),
})

export const updateTaskProgressSchema = z.object({
  id: z.uuid(),
  progressPercent: z.coerce.number().int().min(0).max(100),
  reason: z.string().trim().max(500).optional(),
})

export const changeTaskStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(['assigned', 'in_progress', 'blocked', 'ready_for_review']),
  reason: z.string().trim().max(500).optional(),
}).superRefine((value, context) => {
  if (value.status === 'blocked' && !value.reason) {
    context.addIssue({ code: 'custom', path: ['reason'], message: 'Blocked status requires a reason.' })
  }
})

export const closeTaskSchema = z.object({
  id: z.uuid(),
  reason: z.string().trim().max(500).optional(),
})

export const cancelTaskSchema = z.object({
  id: z.uuid(),
  reason: z.string().trim().min(3).max(500),
})
