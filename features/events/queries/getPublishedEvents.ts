import { createPublicSupabaseClient } from '@/lib/supabase/public'
import { mapPublicEvent } from '../mapper'
import type { PublicEvent } from '../types'
import type { PublicQueryResult } from '@/features/public-content/types'
import { publicQueryError } from '@/features/public-content/types'

const eventColumns = 'id,title,slug,summary,description,category,event_date,start_time,end_time,location,banner_url,volunteer_requirements,capacity,registration_open,published_at'

export async function getPublishedEvents(): Promise<PublicQueryResult<PublicEvent[]>> {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('events')
    .select(eventColumns)
    .eq('status', 'published')
    .order('event_date', { ascending: true })
    .order('published_at', { ascending: false })

  if(error){
    publicQueryError('published_events_query', error)
    return { data: null, error: 'events_unavailable' }
  }

  return { data: data.map(mapPublicEvent), error: null }
}
