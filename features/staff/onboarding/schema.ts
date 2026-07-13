import { z } from 'zod'

export const onboardingSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(120),
  studentId: z.string().trim().min(4, 'Enter your student ID.').max(32),
  email: z.email('Enter a valid email address.').trim().toLowerCase().max(254),
  phone: z.string().trim().min(8, 'Enter a valid phone number.').max(24),
  academicDepartment: z.string().trim().min(2, 'Select your academic department.').max(80),
  trimester: z.string().trim().min(2, 'Select your trimester.').max(40),
  bloodGroup: z.string().trim().max(4).optional(),
  preferredDepartmentId: z
    .string()
    .trim()
    .refine((value) => value === '' || z.uuid().safeParse(value).success, 'Select a valid UIUSSC department.'),
  consent: z.literal('on', { error: 'Confirm that the information is accurate.' }),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>
