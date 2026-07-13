'use server'

import { headers } from 'next/headers'
import { authMessages } from '@/features/auth/errors'
import { passwordResetSchema } from '@/features/auth/schemas/passwordResetSchema'
import type { ActionState } from '@/features/auth/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function requestPasswordResetAction(_previousState: ActionState, formData: FormData): Promise<ActionState>{
  const parsed = passwordResetSchema.safeParse({ email: formData.get('email') })

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please review the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const headerStore = await headers()
  const origin = headerStore.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const supabase = await createServerSupabaseClient()

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  return { status: 'success', message: authMessages.resetRequested }
}
