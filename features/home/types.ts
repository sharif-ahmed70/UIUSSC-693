import type { PublicEvent } from '@/features/events/types'
import type { PublicGalleryItem } from '@/features/gallery/types'
import type { PublicNotice } from '@/features/notices/types'

export type ImpactMetric = {
  label: string
  value: number
  description: string
}

export type ServiceArea = {
  title: string
  description: string
  category?: string
}

export type HomePageData = {
  announcement: PublicNotice | null
  upcomingEvents: PublicEvent[]
  featuredEvents: PublicEvent[]
  nextEvent: PublicEvent | null
  galleryItems: PublicGalleryItem[]
  heroImage: PublicGalleryItem | null
  introImage: PublicGalleryItem | null
  volunteerImage: PublicGalleryItem | null
  impactMetrics: ImpactMetric[]
  categoryCounts: Record<string, number>
  hasEventsError: boolean
  hasNoticesError: boolean
  hasGalleryError: boolean
}
