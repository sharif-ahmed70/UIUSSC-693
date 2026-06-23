import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { getSupabasePublicEnv } from './env'

export async function createServerSupabaseClient(){
  const { supabaseUrl, supabasePublishableKey } = getSupabasePublicEnv()

  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll(){
        return cookieStore.getAll()
      },
      setAll(cookiesToSet){
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components cannot set cookies. Middleware/auth flows can add
          // write-capable cookie handling later when authentication is introduced.
        }
      }
    }
  })
}
