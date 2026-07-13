import { z } from 'zod'

export const approvalReviewSchema = z.object({
  id: z.uuid(),
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().trim().min(3).max(500),
})

export const approvalExecuteSchema = z.object({
  id: z.uuid(),
  confirmExecution: z.literal('yes', { error: 'Confirm execution before continuing.' }),
  reason: z.string().trim().min(3).max(500),
})
