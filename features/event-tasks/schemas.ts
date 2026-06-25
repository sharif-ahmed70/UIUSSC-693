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

export const submitTaskWorkSchema = z.object({
  id: z.uuid(),
  summary: z.string().trim().min(10).max(2000),
  completionNote: z.string().trim().max(1000).optional(),
  evidenceTypes: z.array(z.enum(['document', 'design', 'spreadsheet', 'presentation', 'photo', 'video', 'folder', 'other'])).max(10),
  evidenceLabels: z.array(z.string().trim().max(120)).max(10),
  evidenceUrls: z.array(z.url()).max(10),
}).superRefine((value, context) => {
  if (value.evidenceTypes.length !== value.evidenceLabels.length || value.evidenceTypes.length !== value.evidenceUrls.length) {
    context.addIssue({ code: 'custom', path: ['evidenceUrls'], message: 'Evidence link rows are incomplete.' })
  }

  value.evidenceUrls.forEach((url, index) => {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') {
      context.addIssue({ code: 'custom', path: ['evidenceUrls', index], message: 'Evidence links must use https.' })
    }
    if ([...parsed.searchParams.keys()].some((key) => ['token', 'access_token', 'refresh_token', 'key', 'apikey', 'api_key', 'secret', 'password', 'signature', 'sig'].includes(key.toLowerCase()))) {
      context.addIssue({ code: 'custom', path: ['evidenceUrls', index], message: 'Evidence links must not include secrets or access tokens.' })
    }
    if (!value.evidenceLabels[index]) {
      context.addIssue({ code: 'custom', path: ['evidenceLabels', index], message: 'Evidence labels are required.' })
    }
  })
})

export const reviewTaskSubmissionSchema = z.object({
  id: z.uuid(),
  decision: z.enum(['approve', 'request_revision']),
  reviewNote: z.string().trim().max(1000).optional(),
}).superRefine((value, context) => {
  if (value.decision === 'request_revision' && !value.reviewNote) {
    context.addIssue({ code: 'custom', path: ['reviewNote'], message: 'Revision feedback is required.' })
  }
})

export const withdrawTaskSubmissionSchema = z.object({
  id: z.uuid(),
  reason: z.string().trim().min(3).max(500),
})
