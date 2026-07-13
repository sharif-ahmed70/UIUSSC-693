import type { Database } from '@/types/supabase'

export type BloodDonorProfile = Database['public']['Tables']['blood_donor_profiles']['Row']
export type BloodRequest = Database['public']['Tables']['blood_requests']['Row']
export type BloodMatch = Database['public']['Tables']['blood_matches']['Row']
export type BloodDonation = Database['public']['Tables']['blood_donations']['Row']

export type BloodGroup = BloodDonorProfile['blood_group']
export type BloodRequestStatus = BloodRequest['request_status']
export type BloodMatchStatus = BloodMatch['match_status']
export type BloodDonationStatus = BloodDonation['donation_status']
