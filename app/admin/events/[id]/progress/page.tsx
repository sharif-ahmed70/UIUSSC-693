import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import ProgressBar from '@/components/admin/ProgressBar'
import StatusBadge from '@/components/admin/StatusBadge'
import { getEventDepartmentProgress, getEventProgressSummaries } from '@/features/event-progress/queries'
import { formatDisplayDate } from '@/lib/date'

export default async function AdminEventProgressDetailPage({ params }: { params: Promise<{ id: string }> }){
  const { id } = await params
  const [events, departments] = await Promise.all([getEventProgressSummaries(), getEventDepartmentProgress(id)])
  const event = events.find((item) => item.operation_id === id)
  if (!event) notFound()

  const completion = event.total_tasks === 0 ? 0 : (event.completed_tasks / event.total_tasks) * 100

  return (
    <div>
      <div className="print:hidden">
        <Link href="/admin/event-progress" className="mb-4 inline-flex text-sm font-bold text-uiussc-orange hover:text-[#e85d00]">Back to progress dashboard</Link>
      </div>
      <AdminHeader title={`${event.event_title} progress`} description={`Generated ${formatDisplayDate(new Date().toISOString())}`} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Department assignments" value={event.assigned_department_count} />
        <AdminStatCard label="Completed tasks" value={event.completed_tasks} />
        <AdminStatCard label="Overdue tasks" value={event.overdue_count} />
        <AdminStatCard label="Pending reviews" value={event.pending_review_count} />
      </section>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <div className="flex flex-wrap gap-2"><StatusBadge status={event.operational_status} /><StatusBadge status={event.public_status} /></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ProgressBar value={completion} label="Task completion percentage" />
          <ProgressBar value={event.average_progress} label="Average task progress" />
        </div>
        <p className="mt-4 text-sm text-slate-600">{event.blocked_count} blocked · {event.revision_requested_count} revision requested · {event.unassigned_count} unassigned</p>
      </section>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Department progress</h2>
        <div className="mt-4 overflow-x-auto">
          {departments.length === 0 ? <EmptyAdminState message="No department task progress is visible." /> : (
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr><th className="px-3 py-2">Department</th><th className="px-3 py-2">Responsibility</th><th className="px-3 py-2">Tasks</th><th className="px-3 py-2">Progress</th><th className="px-3 py-2">Risks</th><th className="px-3 py-2">Next deadline</th></tr>
              </thead>
              <tbody>
                {departments.map((department) => (
                  <tr key={department.assignment_id} className="border-t border-slate-200">
                    <td className="px-3 py-3 font-bold text-uiussc-charcoal">{department.department_name}{department.is_lead_department ? ' · Lead' : ''}</td>
                    <td className="px-3 py-3 text-slate-600">{department.responsibility}</td>
                    <td className="px-3 py-3 text-slate-600">{department.completed_tasks}/{department.total_tasks}</td>
                    <td className="px-3 py-3 min-w-44"><ProgressBar value={department.average_progress} label={`${department.department_name} average progress`} /></td>
                    <td className="px-3 py-3 text-slate-600">{department.overdue_count} overdue · {department.blocked_count} blocked · {department.pending_review_count} pending</td>
                    <td className="px-3 py-3 text-slate-600">{department.next_deadline ? formatDisplayDate(department.next_deadline) : 'None'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2 print:grid-cols-1">
        <RiskList title="Overdue or blocked risk" items={departments.filter((item) => item.overdue_count > 0 || item.blocked_count > 0).map((item) => `${item.department_name}: ${item.overdue_count} overdue, ${item.blocked_count} blocked`)} />
        <RiskList title="Review queue" items={departments.filter((item) => item.pending_review_count > 0 || item.revision_requested_count > 0).map((item) => `${item.department_name}: ${item.pending_review_count} pending, ${item.revision_requested_count} revision requested`)} />
        <RiskList title="Unassigned work" items={departments.filter((item) => item.unassigned_count > 0).map((item) => `${item.department_name}: ${item.unassigned_count} unassigned task(s)`)} />
      </section>
    </div>
  )
}

function RiskList({ title, items }: { title: string; items: string[] }){
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
      <h2 className="text-xl font-extrabold text-uiussc-charcoal">{title}</h2>
      <div className="mt-4 grid gap-2 text-sm text-slate-600">
        {items.length === 0 ? <p>No current items.</p> : items.map((item) => <p key={item} className="rounded-md bg-uiussc-ivory px-3 py-2">{item}</p>)}
      </div>
    </section>
  )
}
