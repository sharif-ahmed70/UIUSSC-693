import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getVolunteer(id: string){
  const supabase = await createServerSupabaseClient()
  const [profile, memberships, roles, statusHistory, membershipHistory] = await Promise.all([
    supabase.from('volunteer_profiles').select('*').eq('id', id).maybeSingle(),
    supabase.from('volunteer_department_memberships').select('*, club_departments(name, slug)').eq('volunteer_profile_id', id).order('created_at', { ascending: false }),
    supabase.from('volunteer_platform_roles').select('id, role, status, assigned_at, revoked_at').eq('volunteer_profile_id', id).order('assigned_at', { ascending: false }),
    supabase.from('volunteer_status_history').select('id, previous_status, new_status, reason, changed_at').eq('volunteer_profile_id', id).order('changed_at', { ascending: false }),
    supabase.from('department_membership_history').select('id, department_membership_id, previous_status, new_status, previous_role, new_role, reason, changed_at').order('changed_at', { ascending: false }).limit(20),
  ])

  return {
    profile: profile.data,
    memberships: memberships.data ?? [],
    roles: roles.data ?? [],
    statusHistory: statusHistory.data ?? [],
    membershipHistory: membershipHistory.data ?? [],
  }
}
