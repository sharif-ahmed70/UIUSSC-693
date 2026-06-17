export type Event = {
  slug: string
  title: string
  category: string
  date: string
  location: string
  description: string
  status: 'Open'|'Closed'
  requirements?: string
}

export type Notice = {
  id: string
  title: string
  date: string
  category: string
  priority: string
  summary: string
}

export type GalleryItem = {
  id: string
  category: string
  caption: string
}
