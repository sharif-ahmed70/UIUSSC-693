import { z } from 'zod'
import { bloodAvailabilityStatuses, bloodGroups } from './constants'

const optionalText = z.string().trim().max(160).optional().transform((value) => value || '')

export const publicBloodRequestSchema = z.object({
  requesterName: z.string().trim().min(2, 'Enter requester name.').max(120),
  phone: z.string().trim().min(7, 'Enter a valid phone number.').max(32),
  email: z.string().trim().email('Enter a valid email.').optional().or(z.literal('')).transform((value) => value || ''),
  bloodGroup: z.enum(bloodGroups, 'Select a valid blood group.'),
  unitsRequested: z.coerce.number().int().min(1).max(8),
  neededAt: z.string().trim().min(1, 'Enter required date and time.'),
  hospitalName: z.string().trim().min(2, 'Enter hospital name.').max(160),
  hospitalArea: optionalText,
  district: optionalText,
  urgency: z.enum(['normal', 'urgent', 'emergency']),
  patientReference: optionalText,
  requesterRelationship: optionalText,
  website: z.string().trim().max(0).optional().or(z.literal('')),
})

export const publicBloodDonorSchema = z.object({
  displayName: z.string().trim().min(2, 'Enter donor name.').max(120),
  phone: z.string().trim().min(7, 'Enter a valid phone number.').max(32),
  email: z.string().trim().email('Enter a valid email.').optional().or(z.literal('')).transform((value) => value || ''),
  bloodGroup: z.enum(bloodGroups, 'Select a valid blood group.'),
  district: optionalText,
  area: optionalText,
  availabilityStatus: z.enum(bloodAvailabilityStatuses),
  preferredContactMethod: z.enum(['phone', 'sms', 'whatsapp', 'email']),
  lastDonationDate: z.string().trim().optional().transform((value) => value || ''),
  website: z.string().trim().max(0).optional().or(z.literal('')),
})

export type PublicBloodRequestInput = z.infer<typeof publicBloodRequestSchema>
export type PublicBloodDonorInput = z.infer<typeof publicBloodDonorSchema>
