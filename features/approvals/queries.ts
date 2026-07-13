import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { ApprovalRequestListItem } from './types'

export async function getApprovalRequests(): Promise<ApprovalRequestListItem[]>{
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('approval_requests')
    .select(`
      *,
      requester:volunteer_profiles!approval_requests_requester_profile_id_fkey(full_name,email),
      reviewer:volunteer_profiles!approval_requests_reviewed_by_fkey(full_name),
      approval_request_actions(*)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  return (data ?? []) as ApprovalRequestListItem[]
}
