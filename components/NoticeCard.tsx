import { formatDisplayDate } from '@/lib/date'
import type { PublicNotice } from '@/features/notices/types'

export default function NoticeCard({ notice }: { notice: PublicNotice }){
  const isHigh = notice.priority === 'urgent' || notice.isPinned
  const priorityLabel = notice.priority.charAt(0).toUpperCase() + notice.priority.slice(1)

  return (
    <article className={`relative overflow-hidden rounded-lg border bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl ${isHigh ? 'border-uiussc-green/35' : 'border-slate-200'}`}>
      {isHigh && <div className="absolute left-0 top-0 h-full w-1.5 bg-uiussc-green" />}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{notice.category}</p>
          <h3 className="mt-2 text-lg font-bold text-uiussc-navy">{notice.title}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${isHigh ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          {priorityLabel}
        </span>
      </div>
      {notice.publishedAt && <div className="mt-3 text-sm font-semibold text-slate-500">{formatDisplayDate(notice.publishedAt)}</div>}
      <p className="mt-3 text-sm leading-6 text-slate-600">{notice.excerpt}</p>
    </article>
  )
}
