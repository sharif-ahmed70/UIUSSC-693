import 'server-only'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { getSupabasePublicEnv } from './env'

export function createPublicSupabaseClient(){
  const { supabaseUrl, supabasePublishableKey } = getSupabasePublicEnv()

  return createClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
