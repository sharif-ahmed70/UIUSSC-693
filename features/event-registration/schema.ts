import { z } from 'zod'
import { bloodGroups } from '../../data/membership'

const controlCharacterPattern = /[\u0000-\u001F\u007F]/
const studentIdPattern = /^[A-Z0-9-]+$/i
const slugPattern = /^[a-z0-9-]+$/
const bangladeshPhonePattern = /^\+8801\d{9}$/

export const eventRegistrationSchema = z.object({
  eventSlug: z
    .string()
    .min(2, 'Event reference is missing.')
    .max(160, 'Event reference is invalid.')
    .regex(slugPattern, 'Event reference is invalid.'),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters.')
    .max(100, 'Full name must be 100 characters or fewer.')
    .refine((value) => !controlCharacterPattern.test(value), 'Full name contains invalid characters.'),
  studentId: z
    .string()
    .min(5, 'Student ID must be at least 5 characters.')
    .max(30, 'Student ID must be 30 characters or fewer.')
    .regex(studentIdPattern, 'Student ID may contain only letters, numbers, and hyphens.')
    .refine((value) => !controlCharacterPattern.test(value), 'Student ID contains invalid characters.')
    .nullable(),
  email: z
    .email('Enter a valid email address.')
    .max(254, 'Email must be 254 characters or fewer.'),
  phone: z
    .string()
    .regex(bangladeshPhonePattern, 'Enter a valid Bangladesh mobile number.'),
  bloodGroup: z
    .string()
    .refine((value) => bloodGroups.includes(value), 'Select a valid blood group.')
    .nullable(),
  motivation: z
    .string()
    .min(10, 'Motivation must be at least 10 characters when provided.')
    .max(1500, 'Motivation must be 1500 characters or fewer.')
    .nullable(),
  website: z.literal('', { error: 'We could not complete your registration right now. Please try again shortly.' }),
})

export type ValidatedEventRegistration = z.infer<typeof eventRegistrationSchema>
