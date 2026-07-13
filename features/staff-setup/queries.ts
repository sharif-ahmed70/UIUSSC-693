import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export function maskEmail(email: string | null | undefined){
  if (!email) return 'No email'
  const [local, domain] = email.split('@')
  if (!local || !domain) return 'Email on file'
  const visible = local.length <= 2 ? local[0] ?? '' : `${local[0]}${local[1]}`
  return `${visible}${'*'.repeat(Math.max(2, local.length - visible.length))}@${domain}`
}

export async function getStaffSetupData(profileId: string){
  const supabase = await createServerSupabaseClient()
  const [profile, departments, positions, activePlatformRoles, activePositions, memberships, approvedStaff] = await Promise.all([
    supabase.from('volunteer_profiles').select('*').eq('id', profileId).maybeSingle(),
    supabase.from('club_departments').select('id,name,slug,status,archived_at').eq('status', 'active').is('archived_at', null).order('display_order', { ascending: true }),
    supabase.from('club_positions').select('id,name,slug,status').eq('status', 'active').is('archived_at', null).order('display_order', { ascending: true }),
    supabase.from('volunteer_platform_roles').select('role,status').eq('volunteer_profile_id', profileId).eq('status', 'active'),
    supabase.from('volunteer_club_positions').select('status,is_primary,club_positions(name,slug)').eq('volunteer_profile_id', profileId).eq('status', 'active'),
    supabase.from('volunteer_department_memberships').select('membership_status,department_role,club_departments(name,slug)').eq('volunteer_profile_id', profileId).neq('membership_status', 'removed'),
    supabase.from('volunteer_profiles').select('id,full_name,email,account_status,onboarding_status').in('account_status', ['approved', 'pending']).order('full_name', { ascending: true }).limit(250),
  ])

  return {
    profile: profile.data,
    departments: departments.data ?? [],
    positions: positions.data ?? [],
    activePlatformRoles: activePlatformRoles.data ?? [],
    activePositions: activePositions.data ?? [],
    memberships: memberships.data ?? [],
    approvedStaff: approvedStaff.data ?? [],
  }
}

export async function getApprovedStaffSelectorOptions(){
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('volunteer_profiles')
    .select('id,full_name,email,account_status,onboarding_status')
    .eq('account_status', 'approved')
    .eq('onboarding_status', 'approved')
    .is('archived_at', null)
    .order('full_name', { ascending: true })
    .limit(300)

  return data ?? []
}
