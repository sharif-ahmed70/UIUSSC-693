import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { InvitationFormOptions, StaffInvitationListItem } from './types'

export async function getStaffInvitations(): Promise<StaffInvitationListItem[]>{
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('staff_invitations')
    .select(`
      *,
      club_positions(name,slug),
      invited_by_profile:volunteer_profiles!staff_invitations_invited_by_fkey(full_name),
      staff_invitation_department_scopes(*, club_departments(name,slug))
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  return (data ?? []) as StaffInvitationListItem[]
}

export async function getStaffInvitation(id: string): Promise<StaffInvitationListItem | null>{
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('staff_invitations')
    .select(`
      *,
      club_positions(name,slug),
      invited_by_profile:volunteer_profiles!staff_invitations_invited_by_fkey(full_name),
      staff_invitation_department_scopes(*, club_departments(name,slug))
    `)
    .eq('id', id)
    .maybeSingle()

  return (data ?? null) as StaffInvitationListItem | null
}

export async function getInvitationFormOptions(): Promise<InvitationFormOptions>{
  const supabase = await createServerSupabaseClient()
  const [{ data: positions }, { data: departments }] = await Promise.all([
    supabase
      .from('club_positions')
      .select('id, name, slug')
      .eq('status', 'active')
      .order('display_order', { ascending: true }),
    supabase
      .from('club_departments')
      .select('id, name, slug')
      .eq('status', 'active')
      .is('archived_at', null)
      .order('display_order', { ascending: true }),
  ])

  return {
    positions: positions ?? [],
    departments: departments ?? [],
  }
}
