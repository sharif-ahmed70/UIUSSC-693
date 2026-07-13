import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getDepartments(){
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('club_departments').select('*').order('display_order', { ascending: true })
  return data ?? []
}
