import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getAdminDashboardData(){
  const supabase = await createServerSupabaseClient()

  const [
    pendingApplications,
    awaitingProfiles,
    departmentRequests,
    approvedVolunteers,
    activeDepartments,
    recentAuditLogs,
  ] = await Promise.all([
    supabase.from('membership_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('volunteer_profiles').select('id', { count: 'exact', head: true }).in('onboarding_status', ['submitted', 'under_review']),
    supabase.from('volunteer_department_memberships').select('id', { count: 'exact', head: true }).in('membership_status', ['requested', 'under_review']),
    supabase.from('volunteer_profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'approved'),
    supabase.from('club_departments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('club_audit_logs').select('id, action, entity_type, created_at').order('created_at', { ascending: false }).limit(5),
  ])

  return {
    pendingApplications: pendingApplications.count ?? 0,
    awaitingProfiles: awaitingProfiles.count ?? 0,
    departmentRequests: departmentRequests.count ?? 0,
    approvedVolunteers: approvedVolunteers.count ?? 0,
    activeDepartments: activeDepartments.count ?? 0,
    recentAuditLogs: recentAuditLogs.data ?? [],
  }
}
