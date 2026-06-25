import type { Database } from '@/types/supabase'

export type StaffInvitation = Database['public']['Tables']['staff_invitations']['Row']
export type StaffInvitationDepartmentScope = Database['public']['Tables']['staff_invitation_department_scopes']['Row']

export type StaffInvitationListItem = StaffInvitation & {
  club_positions: { name: string | null; slug: string | null } | null
  invited_by_profile: { full_name: string | null } | null
  staff_invitation_department_scopes: Array<StaffInvitationDepartmentScope & {
    club_departments: { name: string | null; slug: string | null } | null
  }>
}

export type InvitationFormOptions = {
  positions: Array<{ id: string; name: string; slug: string }>
  departments: Array<{ id: string; name: string; slug: string }>
}
