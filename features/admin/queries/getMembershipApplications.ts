import 'server-only'

import { paginationRange } from './listParams'
import type { AdminListParams } from '@/features/admin/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getMembershipApplications(params: AdminListParams){
  const supabase = await createServerSupabaseClient()
  const { from, to } = paginationRange(params)
  let query = supabase
    .from('membership_applications')
    .select('id, full_name, student_id, email, phone, department, interested_department, status, submitted_at, reviewed_at', { count: 'exact' })
    .order('submitted_at', { ascending: false })
    .range(from, to)

  if (params.status) {
    query = query.eq('status', params.status)
  }

  if (params.search) {
    query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%,student_id.ilike.%${params.search}%`)
  }

  const { data, count } = await query
  return { items: data ?? [], count: count ?? 0 }
}
