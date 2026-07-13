import { z } from 'zod'

export const staffInvitationSchema = z.object({
  invitedEmail: z.email().trim().toLowerCase(),
  invitedName: z.string().trim().max(120).optional(),
  intendedClubPositionId: z.string().trim().optional(),
  intendedPlatformRole: z.enum(['', 'club_admin', 'membership_admin', 'content_admin', 'department_admin']),
  expiresAt: z.string().trim().optional(),
  departmentIds: z.array(z.uuid()),
  departmentRoles: z.array(z.enum(['department_head', 'deputy_head', 'executive'])),
  reason: z.string().trim().min(3).max(500),
}).superRefine((value, context) => {
  const activePairs = value.departmentIds
    .map((departmentId, index) => ({ departmentId, role: value.departmentRoles[index] }))
    .filter((item) => item.departmentId)

  if (new Set(activePairs.map((item) => item.departmentId)).size !== activePairs.length) {
    context.addIssue({ code: 'custom', path: ['departmentIds'], message: 'Do not add the same department more than once.' })
  }

  if (activePairs.some((item) => !item.role)) {
    context.addIssue({ code: 'custom', path: ['departmentRoles'], message: 'Select a role for every department scope.' })
  }
})

export const cancelStaffInvitationSchema = z.object({
  id: z.uuid(),
  reason: z.string().trim().min(3).max(500),
})
