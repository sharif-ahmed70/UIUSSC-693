import type { Database } from '@/types/supabase'
import type { PublicNotice } from './types'

type NoticeRow = Pick<
  Database['public']['Tables']['notices']['Row'],
  'id' | 'title' | 'slug' | 'excerpt' | 'content' | 'category' | 'priority' | 'is_pinned' | 'published_at'
>

export function mapPublicNotice(row: NoticeRow): PublicNotice {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    priority: row.priority,
    isPinned: row.is_pinned,
    publishedAt: row.published_at,
  }
}
