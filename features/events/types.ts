export type PublicEvent = {
  id: string
  title: string
  slug: string
  summary: string
  description: string
  category: string
  eventDate: string
  startTime: string | null
  endTime: string | null
  location: string
  bannerUrl: string | null
  volunteerRequirements: string | null
  capacity: number | null
  registrationOpen: boolean
  publishedAt: string | null
}
