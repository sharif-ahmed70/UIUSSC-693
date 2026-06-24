import type { Database } from '@/types/supabase'

export type SystemPermission = Database['public']['Tables']['system_permissions']['Row']
export type UserPermissionOverride = Database['public']['Tables']['user_permission_overrides']['Row']

export type AccessControlSummary = {
  permissions: SystemPermission[]
  overrides: Array<UserPermissionOverride & {
    system_permissions: Pick<SystemPermission, 'permission_key' | 'name' | 'risk_level'> | null
    volunteer_profiles: { full_name: string | null; email: string | null } | null
  }>
}
