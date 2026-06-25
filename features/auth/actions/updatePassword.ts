'use server'

import { redirect } from 'next/navigation'
import { authMessages } from '@/features/auth/errors'
import { updatePasswordSchema } from '@/features/auth/schemas/updatePasswordSchema'
import type { ActionState } from '@/features/auth/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function updatePasswordAction(_previousState: ActionState, formData: FormData): Promise<ActionState>{
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please review the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) {
    return { status: 'error', message: authMessages.invalidRecoveryLink }
  }

  await supabase.auth.signOut()
  redirect('/login?message=password-updated')
}
