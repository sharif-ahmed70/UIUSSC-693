import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import { getSupabasePublicEnv } from './env'

export function createBrowserSupabaseClient(){
  const { supabaseUrl, supabasePublishableKey } = getSupabasePublicEnv()

  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey)
}
