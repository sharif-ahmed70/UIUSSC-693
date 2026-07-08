import AnnouncementStrip from '@/components/home/AnnouncementStrip'
import Navbar from '@/components/Navbar'
import { getPublishedNotices } from '@/features/notices/queries/getPublishedNotices'
import { getUnreadNotificationCount } from '@/features/notifications/queries'

export default async function AppHeader(){
  const [notices, unreadNotifications] = await Promise.all([getPublishedNotices(), getUnreadNotificationCount()])
  const announcement = notices.data?.find((notice) => notice.isPinned) ?? notices.data?.[0] ?? null

  return (
    <>
      <AnnouncementStrip notice={notices.error ? null : announcement} />
      <Navbar unreadNotifications={unreadNotifications} />
    </>
  )
}
