import { cache } from 'react'
import { createPublicSupabaseClient } from '@/lib/supabase/public'
import { publicQueryError, type PublicQueryResult } from '@/features/public-content/types'
import { mapPublicEvent } from '../mapper'
import type { PublicEvent } from '../types'

const eventColumns = 'id,title,slug,summary,description,category,event_date,start_time,end_time,location,banner_url,volunteer_requirements,capacity,registration_open,published_at'
const slugPattern = /^[a-z0-9-]{2,160}$/

export function normalizeEventSlug(slug: string){
  const normalized = slug.trim().toLowerCase()
  return slugPattern.test(normalized) ? normalized : null
}

export const getPublishedEventBySlug = cache(async (slug: string): Promise<PublicQueryResult<PublicEvent | null>> => {
  const normalizedSlug = normalizeEventSlug(slug)

  if(!normalizedSlug){
    return { data: null, error: null }
  }

  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('events')
    .select(eventColumns)
    .eq('status', 'published')
    .eq('slug', normalizedSlug)
    .maybeSingle()

  if(error){
    publicQueryError('published_event_by_slug_query', error)
    return { data: null, error: 'event_unavailable' }
  }

  return { data: data ? mapPublicEvent(data) : null, error: null }
})
