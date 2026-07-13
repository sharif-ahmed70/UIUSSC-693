'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { AdminActionState } from '@/features/admin/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const idSchema = z.string().uuid()

export async function markNotificationReadAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const parsed = idSchema.safeParse(formData.get('id'))
  if (!parsed.success) return { status: 'error', message: 'Notification could not be updated.' }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('mark_notification_read' as never, { p_notification_id: parsed.data } as never)
  if (error) return { status: 'error', message: 'Notification could not be updated.' }

  revalidatePath('/notifications')
  return { status: 'success', message: 'Marked as read.' }
}

export async function markAllNotificationsReadAction(): Promise<void>{
  const supabase = await createServerSupabaseClient()
  await supabase.rpc('mark_all_notifications_read' as never)
  revalidatePath('/notifications')
}

export async function updateNotificationPreferencesAction(_state: AdminActionState, formData: FormData): Promise<AdminActionState>{
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.rpc('update_notification_preferences' as never, {
    p_event_updates_enabled: formData.get('eventUpdates') === 'on',
    p_task_updates_enabled: formData.get('taskUpdates') === 'on',
    p_blood_alerts_enabled: formData.get('bloodAlerts') === 'on',
    p_committee_updates_enabled: formData.get('committeeUpdates') === 'on',
    p_approval_updates_enabled: formData.get('approvalUpdates') === 'on',
    p_system_updates_enabled: formData.get('systemUpdates') === 'on',
  } as never)

  if (error) return { status: 'error', message: 'Preferences could not be updated.' }
  revalidatePath('/notifications')
  return { status: 'success', message: 'Preferences updated.' }
}
