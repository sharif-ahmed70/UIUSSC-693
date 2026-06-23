import { createPublicSupabaseClient } from '@/lib/supabase/public'
import { publicQueryError, type PublicQueryResult } from '@/features/public-content/types'
import { mapPublicEvent } from '../mapper'
import type { PublicEvent } from '../types'

const eventColumns = 'id,title,slug,summary,description,category,event_date,start_time,end_time,location,banner_url,volunteer_requirements,capacity,registration_open,published_at'

function getBangladeshDate(){
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(new Date())
}

export async function getUpcomingEvents(limit: number): Promise<PublicQueryResult<PublicEvent[]>> {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('events')
    .select(eventColumns)
    .eq('status', 'published')
    .gte('event_date', getBangladeshDate())
    .order('event_date', { ascending: true })
    .limit(limit)

  if(error){
    publicQueryError('upcoming_events_query', error)
    return { data: null, error: 'events_unavailable' }
  }

  return { data: data.map(mapPublicEvent), error: null }
}
