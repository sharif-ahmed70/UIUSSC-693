import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import ProgressBar from '@/components/admin/ProgressBar'
import StatusBadge from '@/components/admin/StatusBadge'
import { getEventProgressSummaries, getOperationalEventDashboard, getProgressFilterDepartments } from '@/features/event-progress/queries'
import type { EventProgressFilters } from '@/features/event-progress/types'
import { formatDisplayDate, formatEventDate } from '@/lib/date'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const statusOptions = ['draft', 'planning', 'awaiting_approval', 'approved', 'published', 'active', 'completed', 'cancelled']
const riskOptions = [
  { value: 'overdue', label: 'Overdue only' },
  { value: 'blocked', label: 'Blocked only' },
  { value: 'pending_review', label: 'Pending review only' },
  { value: 'revision_requested', label: 'Revision requested only' },
] as const

function firstParam(value: string | string[] | undefined){
  return Array.isArray(value) ? value[0] : value
}

function parseFilters(params: Record<string, string | string[] | undefined>): EventProgressFilters{
  const status = firstParam(params.status)
  const timeframe = firstParam(params.timeframe)
  const departmentId = firstParam(params.departmentId)
  const risk = firstParam(params.risk)
  return {
    status: statusOptions.includes(status ?? '') ? status : null,
    timeframe: timeframe === 'upcoming' || timeframe === 'past' ? timeframe : null,
    departmentId: departmentId || null,
    risk: risk === 'overdue' || risk === 'blocked' || risk === 'pending_review' || risk === 'revision_requested' ? risk : null,
    limit: 50,
  }
}

function exportHref(report: 'event' | 'tasks', filters: EventProgressFilters){
  const params = new URLSearchParams({ report })
  if (filters.status) params.set('status', filters.status)
  if (filters.timeframe) params.set('timeframe', filters.timeframe)
  if (filters.departmentId) params.set('departmentId', filters.departmentId)
  if (filters.risk) params.set('risk', filters.risk)
  return `/admin/event-progress/export?${params.toString()}`
}

export default async function AdminEventProgressPage({ searchParams }: PageProps){
  const params = await searchParams
  const filters = parseFilters(params)
  const [dashboard, events, departments] = await Promise.all([
    getOperationalEventDashboard(filters),
    getEventProgressSummaries(filters),
    getProgressFilterDepartments(),
  ])
  const hasFilters = Boolean(filters.status || filters.timeframe || filters.departmentId || filters.risk)

  return (
    <div>
      <AdminHeader title="Event progress" description="Operational progress, risks, review queue, and export-ready event reporting." />
      <form className="mb-5 rounded-md border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5">
        <div className="grid gap-3 md:grid-cols-4">
          <label htmlFor="status" className="grid gap-1 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Status
            <select id="status" name="status" defaultValue={filters.status ?? ''} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm normal-case tracking-normal text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
              <option value="">All statuses</option>
              {statusOptions.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
            </select>
          </label>
          <label htmlFor="timeframe" className="grid gap-1 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Timeframe
            <select id="timeframe" name="timeframe" defaultValue={filters.timeframe ?? ''} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm normal-case tracking-normal text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
              <option value="">All dates</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </label>
          <label htmlFor="departmentId" className="grid gap-1 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Department
            <select id="departmentId" name="departmentId" defaultValue={filters.departmentId ?? ''} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm normal-case tracking-normal text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
              <option value="">All departments</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
          </label>
          <label htmlFor="risk" className="grid gap-1 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Risk
            <select id="risk" name="risk" defaultValue={filters.risk ?? ''} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm normal-case tracking-normal text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
              <option value="">All risk states</option>
              {riskOptions.map((risk) => <option key={risk.value} value={risk.value}>{risk.label}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="rounded-md bg-uiussc-charcoal px-4 py-2 text-sm font-extrabold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">Apply filters</button>
            {hasFilters && <Link href="/admin/event-progress" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-700 transition hover:border-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">Clear filters</Link>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={exportHref('event', filters)} className="rounded-md bg-uiussc-orange px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#e85d00] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">Export event CSV</Link>
            <Link href={exportHref('tasks', filters)} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-extrabold text-uiussc-charcoal transition hover:border-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">Export task CSV</Link>
          </div>
        </div>
      </form>

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
        {events.length === 0 ? <EmptyAdminState message="No progress data is visible for your current filters and access." /> : events.map((event) => {
          const completion = event.total_tasks === 0 ? 0 : (event.completed_tasks / event.total_tasks) * 100
          const hasRisk = event.overdue_count > 0 || event.blocked_count > 0
          return (
            <Link key={event.operation_id} href={`/admin/events/${event.operation_id}/progress`} className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5 transition hover:border-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2"><StatusBadge status={event.operational_status} /><StatusBadge status={event.public_status} />{hasRisk && <StatusBadge status="blocked" />}</div>
                  <h2 className="mt-3 text-xl font-extrabold text-uiussc-charcoal">{event.event_title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{formatEventDate(event.event_date)} - {event.assigned_department_count} departments</p>
                </div>
                <div className="min-w-56 text-sm text-slate-600 md:text-right">
                  <p className="font-extrabold text-uiussc-charcoal">{event.completed_tasks}/{event.total_tasks} tasks complete</p>
                  <p className="mt-1">{event.overdue_count} overdue - {event.blocked_count} blocked - {event.pending_review_count} pending review</p>
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
