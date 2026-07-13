import Link from 'next/link'
import StatusBadge from '@/components/admin/StatusBadge'
import type { VolunteerDashboardEvent } from '@/features/volunteer-dashboard/types'
import { formatEventDate } from '@/lib/date'

export default function EventPreview({ events }: { events: VolunteerDashboardEvent[] }){
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {events.map((event) => (
        <article key={`${event.source}-${event.eventId ?? event.attendanceEventId}`} className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-orange">{event.departmentName}</p>
              <h2 className="mt-2 text-xl font-extrabold text-uiussc-charcoal">{event.title}</h2>
            </div>
            <StatusBadge status={event.status} />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-600">{formatEventDate(event.eventDate)} / {event.location ?? 'Location not set'}</p>
          <p className="mt-2 text-sm text-slate-500 capitalize">{event.eventKind.replaceAll('_', ' ')}</p>
          {event.eventId && <Link href={`/events`} className="mt-4 inline-flex text-sm font-bold text-uiussc-orange hover:text-[#e85d00]">Open event page</Link>}
        </article>
      ))}
      {events.length === 0 && <div className="rounded-md border border-slate-200 bg-white p-5 text-sm font-bold text-slate-600">No department events are visible yet.</div>}
    </section>
  )
}
