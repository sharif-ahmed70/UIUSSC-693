import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { AccessControlSummary, SystemPermission, UserPermissionOverride } from './types'

type OverrideRow = UserPermissionOverride & {
  system_permissions: Pick<SystemPermission, 'permission_key' | 'name' | 'risk_level'> | null
  volunteer_profiles: { full_name: string | null; email: string | null } | null
}

export async function getAccessControlSummary(): Promise<AccessControlSummary>{
  const supabase = await createServerSupabaseClient()
  const [{ data: permissions }, { data: overrides }] = await Promise.all([
    supabase
      .from('system_permissions')
      .select('*')
      .eq('is_active', true)
      .order('module_key', { ascending: true })
      .order('permission_key', { ascending: true }),
    supabase
      .from('user_permission_overrides')
      .select('*, system_permissions(permission_key,name,risk_level), volunteer_profiles!user_permission_overrides_volunteer_profile_id_fkey(full_name,email)')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return {
    permissions: (permissions ?? []) as SystemPermission[],
    overrides: (overrides ?? []) as unknown as OverrideRow[],
  }
}
