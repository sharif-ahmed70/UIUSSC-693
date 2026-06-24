import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import StatusBadge from '@/components/admin/StatusBadge'
import { getAdminEventOperations } from '@/features/event-operations/queries'
import { formatEventDate } from '@/lib/date'

export default async function AdminEventsPage(){
  const events = await getAdminEventOperations()

  return (
    <div>
      <AdminHeader title="Event operations" description="Plan, assign departments, publish, and close UIUSSC events without changing the public event model." />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600">
          {['All', 'Draft', 'Planning', 'Published', 'Active', 'Completed'].map((label) => (
            <span key={label} className="rounded-md border border-slate-200 bg-white px-3 py-1.5">{label}</span>
          ))}
        </div>
        <Link href="/admin/events/new" className="inline-flex min-h-10 items-center rounded-md bg-uiussc-orange px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#e85d00] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
          Create event
        </Link>
      </div>

      <section className="grid gap-4">
        {events.length === 0 ? <EmptyAdminState message="No event operations are visible for your current access." /> : events.map((event) => (
          <Link key={event.id} href={`/admin/events/${event.id}`} className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5 transition hover:border-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={event.operationalStatus} />
                <StatusBadge status={event.publicStatus} />
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-extrabold text-slate-700">{event.category}</span>
              </div>
              <h2 className="mt-3 text-xl font-extrabold text-uiussc-charcoal">{event.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{formatEventDate(event.eventDate)} · {event.location}</p>
            </div>
            <div className="text-sm text-slate-600 lg:text-right">
              <p className="font-extrabold text-uiussc-charcoal">{event.progressLabel}</p>
              <p className="mt-1">Lead: {event.leadDepartmentName ?? 'Not assigned'}</p>
              <p className="mt-1">{event.registrationOpen ? 'Registration open' : 'Registration closed'}</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}
