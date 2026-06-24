import { z } from 'zod'

export const idSchema = z.uuid()
export const reasonSchema = z.string().trim().min(3, 'Enter a reason.').max(500)

export const membershipApplicationReviewSchema = z.object({
  id: idSchema,
  status: z.enum(['pending', 'approved', 'rejected', 'waitlisted', 'withdrawn']),
  reason: z.string().trim().max(500).optional(),
  adminNotes: z.string().trim().max(1000).optional(),
})

export const volunteerActionSchema = z.object({
  id: idSchema,
  reason: z.string().trim().max(500).optional(),
})

export const requiredReasonActionSchema = z.object({
  id: idSchema,
  reason: reasonSchema,
})

export const departmentRoleSchema = z.object({
  id: idSchema,
  role: z.enum(['volunteer', 'coordinator', 'department_head']),
  reason: z.string().trim().max(500).optional(),
})

export const platformRoleAssignSchema = z.object({
  profileId: idSchema,
  role: z.enum(['super_admin', 'club_admin', 'membership_admin', 'content_admin', 'department_admin']),
  reason: reasonSchema,
})

export const platformRoleRevokeSchema = z.object({
  id: idSchema,
  reason: reasonSchema,
})

export const departmentCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(80),
  shortDescription: z.string().trim().max(240).optional(),
  displayOrder: z.coerce.number().int().min(0).max(999),
})

export const departmentUpdateSchema = departmentCreateSchema.extend({
  id: idSchema,
  status: z.enum(['active', 'inactive']),
  reason: z.string().trim().max(500).optional(),
})
