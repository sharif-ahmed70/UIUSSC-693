import 'server-only'

import { paginationRange } from './listParams'
import type { AdminListParams } from '@/features/admin/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getVolunteers(params: AdminListParams){
  const supabase = await createServerSupabaseClient()
  const { from, to } = paginationRange(params)
  let query = supabase
    .from('volunteer_profiles')
    .select('id, full_name, student_id, email, phone, academic_department, account_status, onboarding_status, created_at, updated_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params.status) {
    query = query.eq('account_status', params.status)
  }

  if (params.search) {
    query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%,student_id.ilike.%${params.search}%`)
  }

  const { data, count } = await query
  const items = data ?? []
  const ids = items.map((item) => item.id)
  const [roles, positions, memberships] = ids.length ? await Promise.all([
    supabase.from('volunteer_platform_roles').select('volunteer_profile_id').in('volunteer_profile_id', ids).eq('status', 'active'),
    supabase.from('volunteer_club_positions').select('volunteer_profile_id').in('volunteer_profile_id', ids).eq('status', 'active'),
    supabase.from('volunteer_department_memberships').select('volunteer_profile_id').in('volunteer_profile_id', ids).eq('membership_status', 'approved'),
  ]) : [{ data: [] }, { data: [] }, { data: [] }]
  const configuredIds = new Set([
    ...((roles.data ?? []) as { volunteer_profile_id: string }[]).map((item) => item.volunteer_profile_id),
    ...((positions.data ?? []) as { volunteer_profile_id: string }[]).map((item) => item.volunteer_profile_id),
    ...((memberships.data ?? []) as { volunteer_profile_id: string }[]).map((item) => item.volunteer_profile_id),
  ])

  return { items: items.map((item) => ({ ...item, hasAccessSetup: configuredIds.has(item.id) })), count: count ?? 0 }
}
