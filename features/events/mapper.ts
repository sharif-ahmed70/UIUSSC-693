import type { Database } from '@/types/supabase'
import type { PublicEvent } from './types'

type EventRow = Pick<
  Database['public']['Tables']['events']['Row'],
  | 'id'
  | 'title'
  | 'slug'
  | 'summary'
  | 'description'
  | 'category'
  | 'event_date'
  | 'start_time'
  | 'end_time'
  | 'location'
  | 'banner_url'
  | 'volunteer_requirements'
  | 'capacity'
  | 'registration_open'
  | 'published_at'
>

export function mapPublicEvent(row: EventRow): PublicEvent {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    description: row.description,
    category: row.category,
    eventDate: row.event_date,
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location,
    bannerUrl: row.banner_url,
    volunteerRequirements: row.volunteer_requirements,
    capacity: row.capacity,
    registrationOpen: row.registration_open,
    publishedAt: row.published_at,
  }
}
