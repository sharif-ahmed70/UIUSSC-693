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
  return { items: data ?? [], count: count ?? 0 }
}
