import { createPublicSupabaseClient } from '@/lib/supabase/public'
import { publicQueryError, type PublicQueryResult } from '@/features/public-content/types'
import { mapPublicNotice } from '../mapper'
import type { PublicNotice } from '../types'

export async function getPublishedNotices(): Promise<PublicQueryResult<PublicNotice[]>> {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('notices')
    .select('id,title,slug,excerpt,content,category,priority,is_pinned,published_at')
    .eq('status', 'published')
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .order('id', { ascending: true })

  if(error){
    publicQueryError('published_notices_query', error)
    return { data: null, error: 'notices_unavailable' }
  }

  return { data: data.map(mapPublicNotice), error: null }
}
