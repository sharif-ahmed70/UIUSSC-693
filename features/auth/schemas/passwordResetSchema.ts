import { z } from 'zod'

export const passwordResetSchema = z.object({
  email: z.email('Enter a valid email address.').trim().toLowerCase().max(254),
})

export type PasswordResetInput = z.infer<typeof passwordResetSchema>
