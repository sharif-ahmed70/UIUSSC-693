import type { HomePageData, ImpactMetric } from './types'
import type { PublicEvent } from '@/features/events/types'
import type { PublicGalleryItem } from '@/features/gallery/types'
import type { PublicNotice } from '@/features/notices/types'

function getBangladeshDate(){
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function sortUpcoming(events: PublicEvent[]){
  const today = getBangladeshDate()
  return events
    .filter((event) => event.eventDate >= today)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
}

function buildCategoryCounts(events: PublicEvent[]){
  return events.reduce<Record<string, number>>((counts, event) => {
    counts[event.category] = (counts[event.category] ?? 0) + 1
    return counts
  }, {})
}

function buildImpactMetrics(events: PublicEvent[], galleryItems: PublicGalleryItem[]): ImpactMetric[] {
  const categoryCounts = buildCategoryCounts(events)

  return [
    {
      label: 'Published Programs',
      value: events.length,
      description: 'Public UIUSSC programs available to students.',
    },
    {
      label: 'Open Registrations',
      value: events.filter((event) => event.registrationOpen).length,
      description: 'Published programs currently accepting interest.',
    },
    {
      label: 'Focus Areas',
      value: Object.keys(categoryCounts).length,
      description: 'Distinct service categories represented.',
    },
    {
      label: 'Impact Stories',
      value: galleryItems.length,
      description: 'Published gallery moments from club activities.',
    },
  ]
}

export function mapHomePageData({
  events,
  notices,
  galleryItems,
  hasEventsError,
  hasNoticesError,
  hasGalleryError,
}: {
  events: PublicEvent[]
  notices: PublicNotice[]
  galleryItems: PublicGalleryItem[]
  hasEventsError: boolean
  hasNoticesError: boolean
  hasGalleryError: boolean
}): HomePageData {
  const upcomingEvents = sortUpcoming(events)
  const openUpcoming = upcomingEvents.filter((event) => event.registrationOpen)
  const featuredEvents = [...openUpcoming, ...upcomingEvents.filter((event) => !event.registrationOpen), ...events]
    .filter((event, index, source) => source.findIndex((item) => item.id === event.id) === index)
    .slice(0, 4)
  const announcement = notices.find((notice) => notice.isPinned) ?? notices[0] ?? null

  return {
    announcement,
    upcomingEvents: upcomingEvents.slice(0, 3),
    featuredEvents,
    nextEvent: upcomingEvents[0] ?? null,
    galleryItems: galleryItems.slice(0, 6),
    heroImage: galleryItems[0] ?? null,
    introImage: galleryItems[1] ?? galleryItems[0] ?? null,
    volunteerImage: galleryItems[2] ?? galleryItems[0] ?? null,
    impactMetrics: buildImpactMetrics(events, galleryItems),
    categoryCounts: buildCategoryCounts(events),
    hasEventsError,
    hasNoticesError,
    hasGalleryError,
  }
}
