export type PublicGalleryItem = {
  id: string
  title: string
  caption: string | null
  imageUrl: string
  category: string
  eventId: string | null
  displayOrder: number
  publishedAt: string | null
}
