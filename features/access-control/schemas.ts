import { z } from 'zod'

export const temporaryAccessSchema = z.object({
  profileId: z.uuid(),
  permissionKey: z.string().trim().min(3).max(120),
  effect: z.enum(['allow', 'deny']),
  scopeType: z.enum(['global', 'department']),
  departmentId: z.string().trim().optional(),
  eventId: z.string().trim().optional(),
  targetRecordType: z.string().trim().max(80).optional(),
  targetRecordId: z.string().trim().optional(),
  startsAt: z.string().trim().optional(),
  expiresAt: z.string().trim().optional(),
  reason: z.string().trim().min(3).max(500),
}).superRefine((value, context) => {
  if (value.scopeType === 'department' && !value.departmentId) {
    context.addIssue({ code: 'custom', path: ['departmentId'], message: 'Select a department for department-scoped access.' })
  }

  if (value.eventId || value.targetRecordType || value.targetRecordId) {
    context.addIssue({ code: 'custom', path: ['scopeType'], message: 'Event and record scoped access are disabled in this admin UI until CM-5.' })
  }

  if (value.startsAt && value.expiresAt && new Date(value.expiresAt).getTime() <= new Date(value.startsAt).getTime()) {
    context.addIssue({ code: 'custom', path: ['expiresAt'], message: 'Expiry must be after the start date.' })
  }
})

export const revokeTemporaryAccessSchema = z.object({
  id: z.uuid(),
  reason: z.string().trim().min(3).max(500),
})
