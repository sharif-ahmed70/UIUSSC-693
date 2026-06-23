import AnnouncementStrip from '@/components/home/AnnouncementStrip'
import Navbar from '@/components/Navbar'
import { getPublishedNotices } from '@/features/notices/queries/getPublishedNotices'

export default async function AppHeader(){
  const notices = await getPublishedNotices()
  const announcement = notices.data?.find((notice) => notice.isPinned) ?? notices.data?.[0] ?? null

  return (
    <>
      <AnnouncementStrip notice={notices.error ? null : announcement} />
      <Navbar />
    </>
  )
}
