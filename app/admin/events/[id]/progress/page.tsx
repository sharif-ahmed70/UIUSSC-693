import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import ProgressBar from '@/components/admin/ProgressBar'
import StatusBadge from '@/components/admin/StatusBadge'
import { getEventDepartmentProgress, getEventTaskProgressReportRows, getEventTaskRiskRows, getSingleEventProgressSummary } from '@/features/event-progress/queries'
import type { EventTaskProgressReportRow, EventTaskRiskRow } from '@/features/event-progress/types'
import { formatDisplayDate } from '@/lib/date'

export default async function AdminEventProgressDetailPage({ params }: { params: Promise<{ id: string }> }){
  const { id } = await params
  const [event, departments, overdueTasks, blockedTasks, eventTasks, pendingReviewTasks, revisionRequestedTasks] = await Promise.all([
    getSingleEventProgressSummary(id),
    getEventDepartmentProgress(id),
    getEventTaskRiskRows(id, 'overdue', 8),
    getEventTaskRiskRows(id, 'blocked', 8),
    getEventTaskProgressReportRows({ operationId: id, limit: 100 }),
    getEventTaskRiskRows(id, 'pending_review', 8),
    getEventTaskRiskRows(id, 'revision_requested', 8),
  ])
  if (!event) notFound()

  const completion = event.total_tasks === 0 ? 0 : (event.completed_tasks / event.total_tasks) * 100
  const unassignedOnly = eventTasks.filter((task) => task.assignment_state === 'unassigned').slice(0, 8)

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
        <p className="mt-4 text-sm text-slate-600">{event.blocked_count} blocked - {event.revision_requested_count} revision requested - {event.unassigned_count} unassigned</p>
      </section>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Department progress</h2>
        <div className="mt-4 overflow-x-auto">
          {departments.length === 0 ? <EmptyAdminState message="No department assignment is visible." /> : (
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr><th className="px-3 py-2">Department</th><th className="px-3 py-2">Responsibility</th><th className="px-3 py-2">Tasks</th><th className="px-3 py-2">Progress</th><th className="px-3 py-2">Risks</th><th className="px-3 py-2">Next deadline</th></tr>
              </thead>
              <tbody>
                {departments.map((department) => (
                  <tr key={department.assignment_id} className="border-t border-slate-200">
                    <td className="px-3 py-3 font-bold text-uiussc-charcoal">{department.department_name}{department.is_lead_department ? ' - Lead' : ''}</td>
                    <td className="px-3 py-3 text-slate-600">{department.responsibility}</td>
                    <td className="px-3 py-3 text-slate-600">{department.has_no_tasks ? 'No tasks created' : `${department.completed_tasks}/${department.total_tasks}`}</td>
                    <td className="min-w-44 px-3 py-3"><ProgressBar value={department.average_progress} label={`${department.department_name} average progress`} /></td>
                    <td className="px-3 py-3 text-slate-600">{department.overdue_count} overdue - {department.blocked_count} blocked - {department.pending_review_count} pending</td>
                    <td className="px-3 py-3 text-slate-600">{department.next_deadline ? formatDisplayDate(department.next_deadline) : 'None'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2 print:grid-cols-1">
        <TaskRiskList title="Overdue tasks" operationId={id} items={overdueTasks} viewAllHref={`/admin/events/${id}/tasks`} />
        <TaskRiskList title="Blocked tasks" operationId={id} items={blockedTasks} viewAllHref={`/admin/events/${id}/tasks`} />
        <TaskRiskList title="Unassigned tasks" operationId={id} items={unassignedOnly} viewAllHref={`/admin/events/${id}/tasks`} />
        <TaskRiskList title="Pending-review submissions" operationId={id} items={pendingReviewTasks} viewAllHref={`/admin/events/${id}/tasks`} />
        <TaskRiskList title="Revision-requested submissions" operationId={id} items={revisionRequestedTasks} viewAllHref={`/admin/events/${id}/tasks`} />
      </section>
    </div>
  )
}

function TaskRiskList({ title, operationId, items, viewAllHref }: { title: string; operationId: string; items: Array<EventTaskRiskRow | EventTaskProgressReportRow>; viewAllHref: string }){
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">{title}</h2>
        <Link href={viewAllHref} className="text-sm font-bold text-uiussc-orange hover:text-[#e85d00]">View all tasks</Link>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-slate-600">
        {items.length === 0 ? <p>No current items.</p> : items.map((item) => (
          <Link key={item.task_id} href={`/admin/events/${operationId}/tasks/${item.task_id}`} className="rounded-md bg-uiussc-ivory px-3 py-2 transition hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
            <span className="block font-extrabold text-uiussc-charcoal">{item.task_title}</span>
            <span className="mt-1 block">{item.department_name} - {item.priority} - {item.task_status} - {item.progress_percent}% - due {item.due_at ? formatDisplayDate(item.due_at) : 'not set'}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
