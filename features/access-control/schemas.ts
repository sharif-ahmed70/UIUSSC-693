import { z } from 'zod'

export const temporaryAccessSchema = z.object({
  profileId: z.uuid(),
  permissionKey: z.string().trim().min(3).max(120),
  effect: z.enum(['allow', 'deny']),
  scopeType: z.enum(['global', 'department', 'event']),
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

  if (value.scopeType === 'event' && !value.eventId) {
    context.addIssue({ code: 'custom', path: ['eventId'], message: 'Select an event for event-scoped access.' })
  }

  if (value.targetRecordType || value.targetRecordId) {
    context.addIssue({ code: 'custom', path: ['scopeType'], message: 'Record scoped access is disabled until a safe allowlisted resource picker exists.' })
  }

  if (value.startsAt && value.expiresAt && new Date(value.expiresAt).getTime() <= new Date(value.startsAt).getTime()) {
    context.addIssue({ code: 'custom', path: ['expiresAt'], message: 'Expiry must be after the start date.' })
  }
})

export const revokeTemporaryAccessSchema = z.object({
  id: z.uuid(),
  reason: z.string().trim().min(3).max(500),
})
