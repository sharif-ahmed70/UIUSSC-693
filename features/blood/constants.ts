export const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const

export const bloodComponentTypes = ['whole_blood', 'packed_red_cells', 'platelets', 'plasma', 'other'] as const

export const bloodRequestStatuses = [
  'submitted',
  'under_review',
  'approved',
  'matching',
  'partially_fulfilled',
  'fulfilled',
  'rejected',
  'cancelled',
  'expired',
  'archived',
] as const

export const bloodMatchStatuses = [
  'suggested',
  'shortlisted',
  'approved_for_contact',
  'contacted',
  'interested',
  'declined',
  'unavailable',
  'confirmed',
  'completed',
  'cancelled',
] as const

export const bloodDonationStatuses = ['reported', 'under_review', 'verified', 'rejected', 'cancelled'] as const
