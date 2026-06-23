import { getPublishedEvents } from '@/features/events/queries/getPublishedEvents'
import { getPublishedGalleryItems } from '@/features/gallery/queries/getPublishedGalleryItems'
import { getPublishedNotices } from '@/features/notices/queries/getPublishedNotices'
import { mapHomePageData } from '../mapper'
import type { HomePageData } from '../types'

export async function getHomePageData(): Promise<HomePageData> {
  const [eventsResult, noticesResult, galleryResult] = await Promise.all([
    getPublishedEvents(),
    getPublishedNotices(),
    getPublishedGalleryItems(),
  ])

  return mapHomePageData({
    events: eventsResult.data ?? [],
    notices: noticesResult.data ?? [],
    galleryItems: galleryResult.data ?? [],
    hasEventsError: Boolean(eventsResult.error),
    hasNoticesError: Boolean(noticesResult.error),
    hasGalleryError: Boolean(galleryResult.error),
  })
}
