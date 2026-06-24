import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { StaffInvitationListItem } from './types'

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
