import 'server-only'

import { paginationRange } from './listParams'
import type { AdminListParams } from '@/features/admin/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getAuditLogs(params: AdminListParams){
  const supabase = await createServerSupabaseClient()
  const { from, to } = paginationRange(params)
  let query = supabase
    .from('club_audit_logs')
    .select('id, action, entity_type, entity_id, department_id, metadata, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params.search) {
    query = query.or(`action.ilike.%${params.search}%,entity_type.ilike.%${params.search}%`)
  }

  const { data, count } = await query
  return { items: data ?? [], count: count ?? 0 }
}
