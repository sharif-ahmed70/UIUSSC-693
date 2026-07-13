'use server'

import { redirect } from 'next/navigation'
import { authMessages } from '@/features/auth/errors'
import type { ActionState } from '@/features/auth/types'
import { loginSchema } from '@/features/auth/schemas/loginSchema'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import { resolveStaffDestination } from '@/features/staff/routing/resolveStaffDestination'
import { safeRedirectPath } from '@/lib/auth/safeRedirect'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function signInAction(_previousState: ActionState, formData: FormData): Promise<ActionState>{
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next'),
  })

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please review the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    console.warn('Staff sign-in failed', { emailDomain: parsed.data.email.split('@')[1] ?? 'unknown' })
    return { status: 'error', message: authMessages.invalidCredentials }
  }

  const access = await getStaffAccessContext()
  const requestedPath = safeRedirectPath(parsed.data.next, '/staff')
  redirect(resolveStaffDestination(access, requestedPath))
}
