import { createPublicSupabaseClient } from '@/lib/supabase/public'
import { publicQueryError, type PublicQueryResult } from '@/features/public-content/types'
import { mapPublicGalleryItem } from '../mapper'
import type { PublicGalleryItem } from '../types'

export async function getPublishedGalleryItems(limit?: number): Promise<PublicQueryResult<PublicGalleryItem[]>> {
  const supabase = createPublicSupabaseClient()
  let query = supabase
    .from('gallery_items')
    .select('id,title,caption,image_url,category,event_id,display_order,published_at')
    .eq('status', 'published')
    .order('display_order', { ascending: true })
    .order('published_at', { ascending: false })

  if(limit){
    query = query.limit(limit)
  }

  const { data, error } = await query

  if(error){
    publicQueryError('published_gallery_query', error)
    return { data: null, error: 'gallery_unavailable' }
  }

  return { data: data.map(mapPublicGalleryItem), error: null }
}
