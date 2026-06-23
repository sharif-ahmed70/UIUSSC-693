export type PublicNotice = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  priority: string
  isPinned: boolean
  publishedAt: string | null
}
