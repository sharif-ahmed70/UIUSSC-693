import Link from 'next/link'
import { formatDisplayDate } from '@/lib/date'
import type { PublicNotice } from '@/features/notices/types'

export default function AnnouncementStrip({ notice }: { notice: PublicNotice | null }){
  if(!notice) return null

  return (
    <aside className="border-b border-[rgba(21,19,18,0.10)] bg-uiussc-ivory text-uiussc-charcoal">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-uiussc-orange text-white" aria-hidden="true">!</span>
          <p>
            <span className="font-extrabold text-uiussc-orange">Important Update</span>
            <span className="mx-2 text-black/25">/</span>
            <span className="font-semibold">{notice.title}</span>
            {notice.publishedAt && <span className="ml-2 hidden text-uiussc-muted md:inline">{formatDisplayDate(notice.publishedAt)}</span>}
          </p>
        </div>
        <Link href="/notices" className="w-fit font-bold text-uiussc-charcoal underline decoration-uiussc-orange decoration-2 underline-offset-4 transition hover:text-uiussc-orange">
          View Notice
        </Link>
      </div>
    </aside>
  )
}
