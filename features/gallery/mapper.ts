import type { Database } from '@/types/supabase'
import type { PublicGalleryItem } from './types'

type GalleryRow = Pick<
  Database['public']['Tables']['gallery_items']['Row'],
  'id' | 'title' | 'caption' | 'image_url' | 'category' | 'event_id' | 'display_order' | 'published_at'
>

export function mapPublicGalleryItem(row: GalleryRow): PublicGalleryItem {
  return {
    id: row.id,
    title: row.title,
    caption: row.caption,
    imageUrl: row.image_url,
    category: row.category,
    eventId: row.event_id,
    displayOrder: row.display_order,
    publishedAt: row.published_at,
  }
}
