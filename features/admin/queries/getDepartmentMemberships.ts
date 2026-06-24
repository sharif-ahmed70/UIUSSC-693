import 'server-only'

import { paginationRange } from './listParams'
import type { AdminListParams } from '@/features/admin/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getDepartmentMemberships(params: AdminListParams){
  const supabase = await createServerSupabaseClient()
  const { from, to } = paginationRange(params)
  let query = supabase
    .from('volunteer_department_memberships')
    .select('id, department_role, membership_status, is_primary, requested_at, approved_at, volunteer_profile_id, department_id, club_departments(name, slug), volunteer_profiles!volunteer_department_memberships_volunteer_profile_id_fkey(full_name, student_id, email)', { count: 'exact' })
    .order('requested_at', { ascending: false })
    .range(from, to)

  if (params.status) {
    query = query.eq('membership_status', params.status)
  }

  const { data, count } = await query
  return { items: data ?? [], count: count ?? 0 }
}
