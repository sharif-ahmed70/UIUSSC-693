import 'server-only'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getAuthenticatedUser(){
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return null
  }

  return data.user
}

export async function requireAuthenticatedUser(next = '/staff'){
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(next)}`)
  }

  return user
}
