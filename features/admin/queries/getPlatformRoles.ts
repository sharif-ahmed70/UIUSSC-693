import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getPlatformRoles(){
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('volunteer_platform_roles')
    .select('id, volunteer_profile_id, role, status, assigned_at, revoked_at, volunteer_profiles!volunteer_platform_roles_volunteer_profile_id_fkey(full_name, email, student_id)')
    .order('assigned_at', { ascending: false })
    .limit(100)

  return data ?? []
}
