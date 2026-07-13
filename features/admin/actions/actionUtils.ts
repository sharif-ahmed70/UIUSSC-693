import { revalidatePath } from 'next/cache'
import type { AdminActionState } from '@/features/admin/types'
import { getAdminContext } from '@/features/admin/queries/getAdminContext'
import { adminMessages } from '@/features/admin/errors'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type AdminActionAccess =
  | { error: AdminActionState }
  | {
      context: Awaited<ReturnType<typeof getAdminContext>>
      supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
    }

export async function requireAdminAction(permission: keyof Awaited<ReturnType<typeof getAdminContext>>['permissions']): Promise<AdminActionAccess>{
  const context = await getAdminContext()

  if (!context.permissions[permission]) {
    return { error: { status: 'error', message: adminMessages.unauthorized } satisfies AdminActionState }
  }

  const supabase = await createServerSupabaseClient()
  return { context, supabase }
}

export function safeActionError(): AdminActionState{
  return { status: 'error', message: adminMessages.unavailable }
}

export function successAction(paths: string[] = ['/admin']): AdminActionState{
  paths.forEach((path) => revalidatePath(path))
  return { status: 'success', message: adminMessages.success }
}
