import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { BloodDonation, BloodDonorProfile, BloodMatch, BloodRequest } from './types'

export type BloodRequestView = BloodRequest & {
  priority?: 'normal' | 'urgent' | 'critical'
}

type BloodRequestAssignment = {
  id: string
  blood_request_id: string
  volunteer_profile_id: string
  assignment_status: string
  action_label?: string | null
  due_at?: string | null
  completed_at?: string | null
  completion_note?: string | null
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
  requests: BloodRequestView[]
  donors: BloodDonorProfile[]
  matches: BloodMatch[]
  donations: BloodDonation[]
  assignments: BloodRequestAssignment[]
}

export type BloodRequestDetail = {
  request: BloodRequestView
  matches: Array<BloodMatch & { blood_donor_profiles: Pick<BloodDonorProfile, 'display_name' | 'blood_group' | 'district' | 'area' | 'availability_status' | 'verification_status'> | null }>
  donations: BloodDonation[]
  assignments: BloodRequestAssignment[]
  history: Array<{ id: string; previous_status: string | null; new_status: string; reason: string | null; changed_at: string }>
  priorityHistory: Array<{ id: string; previous_priority: string | null; new_priority: string; reason: string | null; changed_at: string }>
  timeline: Array<{ id: string; at: string; title: string; detail: string }>
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
    supabase.from('blood_requests').select('*').order('priority', { ascending: true }).order('needed_at', { ascending: true }).limit(25),
    supabase.from('blood_donor_profiles').select('*').order('created_at', { ascending: false }).limit(20),
    supabase.from('blood_matches').select('*').order('created_at', { ascending: false }).limit(25),
    supabase.from('blood_donations').select('*').order('created_at', { ascending: false }).limit(20),
    untypedSupabase
      .from('blood_request_assignments')
      .select('id, blood_request_id, volunteer_profile_id, assignment_status, action_label, due_at, completed_at, completion_note, volunteer_profiles(full_name,email)')
      .eq('assignment_status', 'active')
      .order('assigned_at', { ascending: false })
      .limit(30),
  ])

  return {
    capabilities,
    requests: sortBloodRequests((requests ?? []) as BloodRequestView[]),
    donors: (donors ?? []) as BloodDonorProfile[],
    matches: (matches ?? []) as BloodMatch[],
    donations: (donations ?? []) as BloodDonation[],
    assignments: (assignments ?? []) as unknown as BloodRequestAssignment[],
  }
}

export async function getBloodRequests(status?: string): Promise<BloodRequestView[]>{
  const supabase = await createServerSupabaseClient()
  let query = supabase.from('blood_requests').select('*').order('needed_at', { ascending: true })

  if (status && status !== 'all') {
    query = query.eq('request_status', status)
  }

  const { data } = await query
  return sortBloodRequests((data ?? []) as BloodRequestView[])
}

export async function getBloodRequestDetail(id: string): Promise<BloodRequestDetail | null>{
  const supabase = await createServerSupabaseClient()
  const untypedSupabase = supabase as unknown as { from: (table: string) => ReturnType<typeof supabase.from> }
  const { data: request } = await supabase.from('blood_requests').select('*').eq('id', id).maybeSingle()

  if (!request) {
    return null
  }

  const [{ data: matches }, { data: donations }, { data: assignments }, { data: history }, { data: priorityRows }] = await Promise.all([
    supabase
      .from('blood_matches')
      .select('*, blood_donor_profiles(display_name,blood_group,district,area,availability_status,verification_status)')
      .eq('blood_request_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('blood_donations').select('*').eq('blood_request_id', id).order('created_at', { ascending: false }),
    untypedSupabase
      .from('blood_request_assignments')
      .select('id, blood_request_id, volunteer_profile_id, assignment_status, action_label, due_at, completed_at, completion_note, volunteer_profiles(full_name,email)')
      .eq('blood_request_id', id)
      .eq('assignment_status', 'active'),
    supabase
      .from('blood_request_status_history')
      .select('id, previous_status, new_status, reason, changed_at')
      .eq('blood_request_id', id)
      .order('changed_at', { ascending: false }),
    untypedSupabase
      .from('blood_request_priority_history')
      .select('id, previous_priority, new_priority, reason, changed_at')
      .eq('blood_request_id', id)
      .order('changed_at', { ascending: false }),
  ])

  const requestHistory = (history ?? []) as BloodRequestDetail['history']
  const priorityHistory = (priorityRows ?? []) as BloodRequestDetail['priorityHistory']

  return {
    request: request as BloodRequestView,
    matches: (matches ?? []) as BloodRequestDetail['matches'],
    donations: (donations ?? []) as BloodDonation[],
    assignments: (assignments ?? []) as unknown as BloodRequestAssignment[],
    history: requestHistory,
    priorityHistory,
    timeline: buildBloodTimeline({
      request: request as BloodRequestView,
      requestHistory,
      priorityHistory,
      matches: (matches ?? []) as BloodMatch[],
      donations: (donations ?? []) as BloodDonation[],
      assignments: (assignments ?? []) as unknown as BloodRequestAssignment[],
    }),
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

  const months = data.donations.reduce<Record<string, number>>((groups, donation) => {
    const sourceDate = donation.donation_date ?? donation.created_at
    const month = sourceDate.slice(0, 7)
    groups[month] = (groups[month] ?? 0) + (donation.verified_units || donation.reported_units || 0)
    return groups
  }, {})
  const activeDonors = data.donors.filter((donor) => donor.verification_status === 'verified' && donor.availability_status === 'available').length
  const fulfillmentRate = data.requests.length === 0 ? 0 : Math.round((data.requests.filter((request) => request.request_status === 'fulfilled').length / data.requests.length) * 100)

  return {
    totalRequests: data.requests.length,
    fulfilledRequests: data.requests.filter((request) => request.request_status === 'fulfilled').length,
    pendingVerification: data.donations.filter((donation) => donation.donation_status === 'reported' || donation.donation_status === 'under_review').length,
    activeMatches: data.matches.filter((match) => !['completed', 'cancelled', 'declined', 'unavailable'].includes(match.match_status)).length,
    activeDonors,
    fulfillmentRate,
    demand,
    months,
  }
}

function sortBloodRequests(requests: BloodRequestView[]){
  const rank: Record<string, number> = { critical: 0, urgent: 1, normal: 2 }
  return [...requests].sort((a, b) => {
    const priorityDiff = (rank[a.priority ?? 'normal'] ?? 3) - (rank[b.priority ?? 'normal'] ?? 3)
    if (priorityDiff !== 0) return priorityDiff
    return new Date(a.needed_at).getTime() - new Date(b.needed_at).getTime()
  })
}

function buildBloodTimeline({
  request,
  requestHistory,
  priorityHistory,
  matches,
  donations,
  assignments,
}: {
  request: BloodRequestView
  requestHistory: BloodRequestDetail['history']
  priorityHistory: BloodRequestDetail['priorityHistory']
  matches: BloodMatch[]
  donations: BloodDonation[]
  assignments: BloodRequestAssignment[]
}): BloodRequestDetail['timeline']{
  const events: BloodRequestDetail['timeline'] = [
    {
      id: `request-${request.id}`,
      at: request.created_at,
      title: 'Request Submitted',
      detail: `${request.blood_group} blood requested for ${request.hospital_name}`,
    },
  ]

  requestHistory.forEach((item) => {
    events.push({
      id: `status-${item.id}`,
      at: item.changed_at,
      title: statusTimelineTitle(item.new_status),
      detail: item.reason ?? 'Updated by Blood Department',
    })
  })

  priorityHistory.forEach((item) => {
    events.push({
      id: `priority-${item.id}`,
      at: item.changed_at,
      title: 'Priority Changed',
      detail: `${item.previous_priority ?? 'New'} to ${item.new_priority}${item.reason ? `: ${item.reason}` : ''}`,
    })
  })

  matches.forEach((match) => {
    events.push({
      id: `match-${match.id}`,
      at: match.created_at,
      title: 'Potential Donor Found',
      detail: 'A potential donor was suggested for human review.',
    })
  })

  assignments.forEach((assignment) => {
    events.push({
      id: `assignment-${assignment.id}`,
      at: assignment.due_at ?? assignment.completed_at ?? new Date().toISOString(),
      title: assignment.completed_at ? 'Assigned Action Completed' : 'Volunteer Assigned',
      detail: assignment.action_label ?? 'Follow up blood request',
    })
  })

  donations.forEach((donation) => {
    events.push({
      id: `donation-${donation.id}`,
      at: donation.donation_date ? `${donation.donation_date}T00:00:00Z` : donation.created_at,
      title: donation.donation_status === 'verified' ? 'Donation Verified' : 'Donation Completed',
      detail: `${donation.reported_units} unit(s) recorded`,
    })
  })

  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
}

function statusTimelineTitle(status: string){
  const titles: Record<string, string> = {
    submitted: 'Request Submitted',
    under_review: 'Review Started',
    approved: 'Verified by Blood Team',
    matching: 'Searching Donor',
    partially_fulfilled: 'Donation Process',
    fulfilled: 'Completed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
  }

  return titles[status] ?? status.replace(/_/g, ' ')
}
