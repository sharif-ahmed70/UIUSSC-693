import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export type Committee = {
  id: string
  name: string
  session_label: string
  start_date: string
  end_date: string | null
  status: string
  created_at: string
}

export type CommitteeMember = {
  id: string
  committee_id: string
  volunteer_profile_id: string
  club_position_id: string
  volunteer_club_position_id: string | null
  assigned_date: string
  start_date: string
  end_date: string | null
  status: string
  reason: string | null
  volunteer_profiles: { full_name: string | null; email: string | null } | null
  club_positions: { name: string | null; slug: string | null; is_core_panel: boolean | null; display_order: number | null } | null
}

export type PublicCommitteeMember = {
  committee_id: string
  committee_name: string
  session_label: string
  start_date: string
  end_date: string | null
  member_name: string
  position_name: string
  position_slug: string
  is_core_panel: boolean
  display_order: number
}

export async function getCommitteeDashboard(){
  const supabase = await createServerSupabaseClient()
  const client = supabase as any

  const [{ data: committees, error: committeesError }, { data: members, error: membersError }] = await Promise.all([
    client
      .from('committees')
      .select('id, name, session_label, start_date, end_date, status, created_at')
      .order('start_date', { ascending: false }),
    client
      .from('committee_memberships')
      .select('id, committee_id, volunteer_profile_id, club_position_id, volunteer_club_position_id, assigned_date, start_date, end_date, status, reason, volunteer_profiles(full_name,email), club_positions(name,slug,is_core_panel,display_order)')
      .order('start_date', { ascending: false }),
  ])

  return {
    committees: ((committees ?? []) as Committee[]),
    members: ((members ?? []) as CommitteeMember[]),
    error: committeesError || membersError ? 'committees_unavailable' : null,
  }
}

export async function getCommitteeDetail(id: string){
  const supabase = await createServerSupabaseClient()
  const client = supabase as any

  const [{ data: committee, error: committeeError }, { data: members, error: membersError }] = await Promise.all([
    client
      .from('committees')
      .select('id, name, session_label, start_date, end_date, status, created_at')
      .eq('id', id)
      .maybeSingle(),
    client
      .from('committee_memberships')
      .select('id, committee_id, volunteer_profile_id, club_position_id, volunteer_club_position_id, assigned_date, start_date, end_date, status, reason, volunteer_profiles(full_name,email), club_positions(name,slug,is_core_panel,display_order)')
      .eq('committee_id', id)
      .order('start_date', { ascending: false }),
  ])

  return {
    committee: committee as Committee | null,
    members: ((members ?? []) as CommitteeMember[]),
    error: committeeError || membersError ? 'committee_unavailable' : null,
  }
}

export async function getCommitteeSelectorData(){
  const supabase = await createServerSupabaseClient()
  const client = supabase as any
  const [{ data: positions }, { data: volunteers }] = await Promise.all([
    client
      .from('club_positions')
      .select('id, name, slug, is_core_panel, display_order')
      .eq('status', 'active')
      .is('archived_at', null)
      .order('display_order', { ascending: true }),
    client
      .from('volunteer_profiles')
      .select('id, full_name, email')
      .eq('account_status', 'approved')
      .eq('onboarding_status', 'approved')
      .is('archived_at', null)
      .order('full_name', { ascending: true }),
  ])

  return {
    positions: (positions ?? []) as Array<{ id: string; name: string; slug: string; is_core_panel: boolean; display_order: number }>,
    volunteers: (volunteers ?? []) as Array<{ id: string; full_name: string; email: string | null }>,
  }
}

export async function getActiveCommitteePublic(){
  const supabase = await createServerSupabaseClient()
  const { data, error } = await (supabase as any).rpc('get_active_committee_public')
  return {
    members: (data ?? []) as PublicCommitteeMember[],
    error: error ? 'active_committee_unavailable' : null,
  }
}

export function groupCommitteeMembers(members: CommitteeMember[]){
  return {
    core: members.filter((member) => member.club_positions?.is_core_panel),
    departmentHeads: members.filter((member) => member.club_positions?.slug?.startsWith('head-')),
    executives: members.filter((member) => member.club_positions?.slug?.startsWith('executive-member')),
    other: members.filter((member) => !member.club_positions?.is_core_panel && !member.club_positions?.slug?.startsWith('head-') && !member.club_positions?.slug?.startsWith('executive-member')),
  }
}

export function groupPublicCommitteeMembers(members: PublicCommitteeMember[]){
  return {
    core: members.filter((member) => member.is_core_panel),
    departmentHeads: members.filter((member) => member.position_slug.startsWith('head-')),
    executives: members.filter((member) => member.position_slug.startsWith('executive-member')),
    other: members.filter((member) => !member.is_core_panel && !member.position_slug.startsWith('head-') && !member.position_slug.startsWith('executive-member')),
  }
}
