import { z } from 'zod'
import { bloodGroups, departments, trimesters, volunteerDepartments } from '../../data/membership'

const controlCharacterPattern = /[\u0000-\u001F\u007F]/
const studentIdPattern = /^[A-Z0-9-]+$/i
const bangladeshPhonePattern = /^\+8801\d{9}$/

function optionSchema(options: readonly string[], message: string){
  return z.string().refine((value) => options.includes(value), { message })
}

export const membershipApplicationSchema = z.object({
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
    .refine((value) => !controlCharacterPattern.test(value), 'Student ID contains invalid characters.'),
  department: optionSchema(departments, 'Select a valid department.'),
  trimester: optionSchema(trimesters, 'Select a valid trimester.'),
  email: z
    .email('Enter a valid email address.')
    .max(254, 'Email must be 254 characters or fewer.'),
  phone: z
    .string()
    .regex(bangladeshPhonePattern, 'Enter a valid Bangladesh mobile number.'),
  bloodGroup: optionSchema(bloodGroups, 'Select a valid blood group.'),
  interestedDepartment: optionSchema(volunteerDepartments, 'Select a valid interested department.'),
  skills: z
    .string()
    .max(500, 'Skills must be 500 characters or fewer.')
    .nullable(),
  motivation: z
    .string()
    .min(20, 'Please write at least 20 characters.')
    .max(1500, 'Motivation must be 1500 characters or fewer.'),
  website: z.literal('', { error: 'We could not submit your application right now. Please try again shortly.' }),
})

export type ValidatedMembershipApplication = z.infer<typeof membershipApplicationSchema>
