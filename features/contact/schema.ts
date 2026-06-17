import { z } from 'zod'

const controlCharacterPattern = /[\u0000-\u001F\u007F]/

export const contactMessageSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name must be 100 characters or fewer.')
    .refine((value) => !controlCharacterPattern.test(value), 'Name contains invalid characters.'),
  email: z
    .email('Enter a valid email address.')
    .max(254, 'Email must be 254 characters or fewer.'),
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters.')
    .max(150, 'Subject must be 150 characters or fewer.')
    .refine((value) => !controlCharacterPattern.test(value), 'Subject contains invalid characters.'),
  message: z
    .string()
    .min(20, 'Message must be at least 20 characters.')
    .max(3000, 'Message must be 3000 characters or fewer.'),
  website: z.literal('', { error: 'We could not send your message right now. Please try again shortly.' }),
})

export type ValidatedContactMessage = z.infer<typeof contactMessageSchema>
