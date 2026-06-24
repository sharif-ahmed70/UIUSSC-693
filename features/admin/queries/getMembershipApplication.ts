import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getMembershipApplication(id: string){
  const supabase = await createServerSupabaseClient()
  const [{ data: application }, { data: history }] = await Promise.all([
    supabase.from('membership_applications').select('*').eq('id', id).maybeSingle(),
    supabase.from('membership_application_status_history').select('id, previous_status, new_status, reason, changed_at').eq('membership_application_id', id).order('changed_at', { ascending: false }),
  ])

  return { application, history: history ?? [] }
}
