import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export type NotificationRow = {
  id: string
  title: string
  message: string
  category: string
  priority: string
  related_module: string | null
  related_record_id: string | null
  action_url: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export type NotificationPreferences = {
  event_updates_enabled: boolean
  task_updates_enabled: boolean
  blood_alerts_enabled: boolean
  committee_updates_enabled: boolean
  approval_updates_enabled: boolean
  system_updates_enabled: boolean
}

export async function getNotifications(){
  const supabase = await createServerSupabaseClient()
  const client = supabase as any
  const [{ data: notifications, error: notificationsError }, { data: preferences }] = await Promise.all([
    client
      .from('notifications')
      .select('id, title, message, category, priority, related_module, related_record_id, action_url, is_read, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    client
      .from('notification_preferences')
      .select('event_updates_enabled, task_updates_enabled, blood_alerts_enabled, committee_updates_enabled, approval_updates_enabled, system_updates_enabled')
      .maybeSingle(),
  ])

  return {
    notifications: (notifications ?? []) as NotificationRow[],
    preferences: (preferences ?? null) as NotificationPreferences | null,
    error: notificationsError ? 'notifications_unavailable' : null,
  }
}

export async function getUnreadNotificationCount(){
  const supabase = await createServerSupabaseClient()
  const { count, error } = await (supabase as any)
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)

  if (error) return 0
  return count ?? 0
}
