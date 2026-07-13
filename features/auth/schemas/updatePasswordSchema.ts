import { z } from 'zod'

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(10, 'Use at least 10 characters.')
      .max(128, 'Password is too long.')
      .regex(/[A-Z]/, 'Use at least one uppercase letter.')
      .regex(/[a-z]/, 'Use at least one lowercase letter.')
      .regex(/[0-9]/, 'Use at least one number.'),
    confirmPassword: z.string(),
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
