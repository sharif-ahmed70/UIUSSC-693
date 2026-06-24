import { z } from 'zod'

export const staffInvitationSchema = z.object({
  invitedEmail: z.email().trim().toLowerCase(),
  invitedName: z.string().trim().max(120).optional(),
  intendedClubPositionId: z.string().trim().optional(),
  intendedPlatformRole: z.enum(['', 'club_admin', 'membership_admin', 'content_admin', 'department_admin']),
  expiresAt: z.string().trim().optional(),
  reason: z.string().trim().min(3).max(500),
})

export const cancelStaffInvitationSchema = z.object({
  id: z.uuid(),
  reason: z.string().trim().min(3).max(500),
})
