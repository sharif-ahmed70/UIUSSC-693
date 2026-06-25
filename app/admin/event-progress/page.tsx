import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import ProgressBar from '@/components/admin/ProgressBar'
import StatusBadge from '@/components/admin/StatusBadge'
import { getEventProgressSummaries, getOperationalEventDashboard } from '@/features/event-progress/queries'
import { formatDisplayDate, formatEventDate } from '@/lib/date'

export default async function AdminEventProgressPage(){
  const [dashboard, events] = await Promise.all([getOperationalEventDashboard(), getEventProgressSummaries()])

  return (
    <div>
      <AdminHeader title="Event progress" description="Operational progress, risks, review queue, and export-ready event reporting." />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600">
          {['All', 'Upcoming', 'Past', 'Overdue only', 'Blocked only', 'Pending review'].map((label) => <span key={label} className="rounded-md border border-slate-200 bg-white px-3 py-1.5">{label}</span>)}
        </div>
        <Link href="/admin/event-progress/export" className="rounded-md bg-uiussc-charcoal px-4 py-2 text-sm font-extrabold text-white transition hover:bg-slate-800">
          Export CSV
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Active/planning events" value={dashboard.active_events} />
        <AdminStatCard label="Awaiting approval" value={dashboard.awaiting_approval_events} />
        <AdminStatCard label="Department assignments" value={dashboard.active_department_assignments} />
        <AdminStatCard label="Active tasks" value={dashboard.active_tasks} />
        <AdminStatCard label="Overdue tasks" value={dashboard.overdue_tasks} />
        <AdminStatCard label="Blocked tasks" value={dashboard.blocked_tasks} />
        <AdminStatCard label="Pending reviews" value={dashboard.pending_reviews} />
        <AdminStatCard label="Revision requested" value={dashboard.revision_requested} />
      </section>

      <section className="mt-6 grid gap-4">
        {events.length === 0 ? <EmptyAdminState message="No progress data is visible for your current access." /> : events.map((event) => {
          const completion = event.total_tasks === 0 ? 0 : (event.completed_tasks / event.total_tasks) * 100
          const hasRisk = event.overdue_count > 0 || event.blocked_count > 0
          return (
            <Link key={event.operation_id} href={`/admin/events/${event.operation_id}/progress`} className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5 transition hover:border-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2"><StatusBadge status={event.operational_status} /><StatusBadge status={event.public_status} />{hasRisk && <StatusBadge status="blocked" />}</div>
                  <h2 className="mt-3 text-xl font-extrabold text-uiussc-charcoal">{event.event_title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{formatEventDate(event.event_date)} · {event.assigned_department_count} departments</p>
                </div>
                <div className="min-w-56 text-sm text-slate-600 md:text-right">
                  <p className="font-extrabold text-uiussc-charcoal">{event.completed_tasks}/{event.total_tasks} tasks complete</p>
                  <p className="mt-1">{event.overdue_count} overdue · {event.blocked_count} blocked · {event.pending_review_count} pending review</p>
                  <p className="mt-1">Next deadline: {event.nearest_deadline ? formatDisplayDate(event.nearest_deadline) : 'None'}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <ProgressBar value={completion} label="Task completion" />
                <ProgressBar value={event.average_progress} label="Average progress" />
              </div>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
