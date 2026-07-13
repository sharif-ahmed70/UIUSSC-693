import type { Database } from '@/types/supabase'

export type ApprovalRequest = Database['public']['Tables']['approval_requests']['Row']
export type ApprovalRequestAction = Database['public']['Tables']['approval_request_actions']['Row']

export type ApprovalRequestListItem = ApprovalRequest & {
  requester: { full_name: string | null; email: string | null } | null
  reviewer: { full_name: string | null } | null
  approval_request_actions: ApprovalRequestAction[]
}
