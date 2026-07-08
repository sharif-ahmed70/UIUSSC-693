import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { BloodDonation, BloodDonorProfile, BloodMatch, BloodRequest } from './types'

type BloodRequestAssignment = {
  id: string
  blood_request_id: string
  volunteer_profile_id: string
  assignment_status: string
  volunteer_profiles: { full_name: string | null; email: string | null } | null
}

export type BloodCapabilities = {
  canView: boolean
  canManageRequests: boolean
  canManageDonors: boolean
  canManageMatches: boolean
  canVerifyDonations: boolean
  canAssignExecutives: boolean
}

export type BloodDashboardData = {
  capabilities: BloodCapabilities
  requests: BloodRequest[]
  donors: BloodDonorProfile[]
  matches: BloodMatch[]
  donations: BloodDonation[]
  assignments: BloodRequestAssignment[]
}

export type BloodRequestDetail = {
  request: BloodRequest
  matches: Array<BloodMatch & { blood_donor_profiles: Pick<BloodDonorProfile, 'display_name' | 'blood_group' | 'district' | 'area' | 'availability_status' | 'verification_status'> | null }>
  donations: BloodDonation[]
  assignments: BloodRequestAssignment[]
  history: Array<{ id: string; previous_status: string | null; new_status: string; reason: string | null; changed_at: string }>
}

export async function getBloodCapabilities(): Promise<BloodCapabilities>{
  const supabase = await createServerSupabaseClient()
  const [view, requests, donors, matches, donations, assign] = await Promise.all([
    supabase.rpc('can_view_blood_operations'),
    supabase.rpc('can_manage_blood_requests'),
    supabase.rpc('can_manage_blood_donors'),
    supabase.rpc('can_manage_blood_matches'),
    supabase.rpc('can_verify_blood_donations'),
    (supabase.rpc as unknown as (name: string) => Promise<{ data: boolean | null }>)('can_assign_blood_executives'),
  ])

  return {
    canView: Boolean(view.data),
    canManageRequests: Boolean(requests.data),
    canManageDonors: Boolean(donors.data),
    canManageMatches: Boolean(matches.data),
    canVerifyDonations: Boolean(donations.data),
    canAssignExecutives: Boolean(assign.data),
  }
}

export async function getBloodDashboardData(): Promise<BloodDashboardData>{
  const supabase = await createServerSupabaseClient()
  const untypedSupabase = supabase as unknown as { from: (table: string) => ReturnType<typeof supabase.from> }
  const capabilities = await getBloodCapabilities()

  const [{ data: requests }, { data: donors }, { data: matches }, { data: donations }, { data: assignments }] = await Promise.all([
    supabase.from('blood_requests').select('*').order('needed_at', { ascending: true }).limit(25),
    supabase.from('blood_donor_profiles').select('*').order('created_at', { ascending: false }).limit(20),
    supabase.from('blood_matches').select('*').order('created_at', { ascending: false }).limit(25),
    supabase.from('blood_donations').select('*').order('created_at', { ascending: false }).limit(20),
    untypedSupabase
      .from('blood_request_assignments')
      .select('id, blood_request_id, volunteer_profile_id, assignment_status, volunteer_profiles(full_name,email)')
      .eq('assignment_status', 'active')
      .order('assigned_at', { ascending: false })
      .limit(30),
  ])

  return {
    capabilities,
    requests: (requests ?? []) as BloodRequest[],
    donors: (donors ?? []) as BloodDonorProfile[],
    matches: (matches ?? []) as BloodMatch[],
    donations: (donations ?? []) as BloodDonation[],
    assignments: (assignments ?? []) as unknown as BloodRequestAssignment[],
  }
}

export async function getBloodRequests(status?: string): Promise<BloodRequest[]>{
  const supabase = await createServerSupabaseClient()
  let query = supabase.from('blood_requests').select('*').order('needed_at', { ascending: true })

  if (status && status !== 'all') {
    query = query.eq('request_status', status)
  }

  const { data } = await query
  return (data ?? []) as BloodRequest[]
}

export async function getBloodRequestDetail(id: string): Promise<BloodRequestDetail | null>{
  const supabase = await createServerSupabaseClient()
  const untypedSupabase = supabase as unknown as { from: (table: string) => ReturnType<typeof supabase.from> }
  const { data: request } = await supabase.from('blood_requests').select('*').eq('id', id).maybeSingle()

  if (!request) {
    return null
  }

  const [{ data: matches }, { data: donations }, { data: assignments }, { data: history }] = await Promise.all([
    supabase
      .from('blood_matches')
      .select('*, blood_donor_profiles(display_name,blood_group,district,area,availability_status,verification_status)')
      .eq('blood_request_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('blood_donations').select('*').eq('blood_request_id', id).order('created_at', { ascending: false }),
    untypedSupabase
      .from('blood_request_assignments')
      .select('id, blood_request_id, volunteer_profile_id, assignment_status, volunteer_profiles(full_name,email)')
      .eq('blood_request_id', id)
      .eq('assignment_status', 'active'),
    supabase
      .from('blood_request_status_history')
      .select('id, previous_status, new_status, reason, changed_at')
      .eq('blood_request_id', id)
      .order('changed_at', { ascending: false }),
  ])

  return {
    request: request as BloodRequest,
    matches: (matches ?? []) as BloodRequestDetail['matches'],
    donations: (donations ?? []) as BloodDonation[],
    assignments: (assignments ?? []) as unknown as BloodRequestAssignment[],
    history: (history ?? []) as BloodRequestDetail['history'],
  }
}

export async function getBloodDonors(filters: { bloodGroup?: string; availability?: string; location?: string } = {}): Promise<BloodDonorProfile[]>{
  const supabase = await createServerSupabaseClient()
  let query = supabase.from('blood_donor_profiles').select('*').is('archived_at', null).order('created_at', { ascending: false })

  if (filters.bloodGroup) query = query.eq('blood_group', filters.bloodGroup)
  if (filters.availability) query = query.eq('availability_status', filters.availability)
  if (filters.location) query = query.or(`district.ilike.%${filters.location}%,area.ilike.%${filters.location}%`)

  const { data } = await query.limit(100)
  return (data ?? []) as BloodDonorProfile[]
}

export async function getPotentialBloodDonors(requestId: string): Promise<Array<Pick<BloodDonorProfile, 'id' | 'display_name' | 'blood_group' | 'district' | 'area' | 'availability_status' | 'verification_status' | 'self_reported_last_donation_date'>>>{
  const detail = await getBloodRequestDetail(requestId)

  if (!detail) return []

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('blood_donor_profiles')
    .select('id, display_name, blood_group, district, area, availability_status, verification_status, self_reported_last_donation_date')
    .eq('blood_group', detail.request.blood_group)
    .eq('verification_status', 'verified')
    .eq('availability_status', 'available')
    .is('archived_at', null)
    .order('self_reported_last_donation_date', { ascending: true, nullsFirst: false })
    .limit(50)

  return (data ?? []) as Array<Pick<BloodDonorProfile, 'id' | 'display_name' | 'blood_group' | 'district' | 'area' | 'availability_status' | 'verification_status' | 'self_reported_last_donation_date'>>
}

export async function getBloodExecutives(){
  const supabase = await createServerSupabaseClient()
  const { data: department } = await supabase.from('club_departments').select('id').eq('slug', 'blood').maybeSingle()

  if (!department) return []

  const { data } = await supabase
    .from('volunteer_department_memberships')
    .select('volunteer_profile_id, department_role, volunteer_profiles(full_name,email)')
    .eq('department_id', department.id)
    .eq('department_role', 'executive')
    .eq('membership_status', 'approved')
    .is('removed_at', null)

  return (data ?? []) as unknown as Array<{ volunteer_profile_id: string; department_role: string; volunteer_profiles: { full_name: string | null; email: string | null } | null }>
}

export async function getBloodAdminReport(){
  const data = await getBloodDashboardData()
  const demand = data.requests.reduce<Record<string, number>>((groups, request) => {
    groups[request.blood_group] = (groups[request.blood_group] ?? 0) + request.units_requested
    return groups
  }, {})

  return {
    totalRequests: data.requests.length,
    fulfilledRequests: data.requests.filter((request) => request.request_status === 'fulfilled').length,
    pendingVerification: data.donations.filter((donation) => donation.donation_status === 'reported' || donation.donation_status === 'under_review').length,
    activeMatches: data.matches.filter((match) => !['completed', 'cancelled', 'declined', 'unavailable'].includes(match.match_status)).length,
    demand,
  }
}
