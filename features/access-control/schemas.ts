import { z } from 'zod'

export const temporaryAccessSchema = z.object({
  profileId: z.uuid(),
  permissionKey: z.string().trim().min(3).max(120),
  effect: z.enum(['allow', 'deny']),
  scopeType: z.enum(['global', 'department', 'event', 'record']),
  departmentId: z.string().trim().optional(),
  eventId: z.string().trim().optional(),
  targetRecordType: z.string().trim().max(80).optional(),
  targetRecordId: z.string().trim().optional(),
  startsAt: z.string().trim().optional(),
  expiresAt: z.string().trim().optional(),
  reason: z.string().trim().min(3).max(500),
})

export const revokeTemporaryAccessSchema = z.object({
  id: z.uuid(),
  reason: z.string().trim().min(3).max(500),
})
