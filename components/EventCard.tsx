import Link from 'next/link'
import { Event } from '@/types'
import { formatEventDate } from '@/lib/date'

export default function EventCard({ event }: { event: Event }){
  const isOpen = event.status === 'Open'

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="h-28 bg-gradient-to-br from-uiussc-navy via-[#123b67] to-uiussc-green p-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">{event.category}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
            {event.status}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug text-uiussc-navy">{event.title}</h3>
        <div className="mt-3 space-y-1 text-sm font-medium text-slate-500">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-uiussc-green" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 3v3M17 3v3M4.5 9.5h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span>{formatEventDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-uiussc-green" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <span>{event.location}</span>
          </div>
        </div>
        <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">{event.description}</p>
        <Link href={`/events/${event.slug}`} className="mt-5 inline-flex min-h-11 items-center text-sm font-bold text-uiussc-navy transition group-hover:text-uiussc-green">
          View details
        </Link>
      </div>
    </article>
  )
}
