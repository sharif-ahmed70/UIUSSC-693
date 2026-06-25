import Link from 'next/link'
import AdminStatCard from '@/components/admin/AdminStatCard'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import StatusBadge from '@/components/admin/StatusBadge'
import { getMyTaskProgressSummary } from '@/features/event-progress/queries'
import { getStaffTasks } from '@/features/event-tasks/queries'
import { formatDisplayDate, formatEventDate } from '@/lib/date'

export default async function StaffProgressPage(){
  const [summary, tasks] = await Promise.all([getMyTaskProgressSummary(), getStaffTasks()])

  return (
    <div className="space-y-6">
      <section className="rounded-md bg-uiussc-charcoal p-6 text-white shadow-xl shadow-slate-900/10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-orange">Progress</p>
        <h1 className="mt-3 text-3xl font-extrabold">Operational progress</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Role-scoped task, deadline, submission, and review progress.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Active tasks" value={summary.active_tasks} />
        <AdminStatCard label="Completed tasks" value={summary.completed_tasks} />
        <AdminStatCard label="Ready to submit" value={summary.ready_to_submit} />
        <AdminStatCard label="Under review" value={summary.under_review} />
        <AdminStatCard label="Revision requested" value={summary.revision_requested} />
        <AdminStatCard label="Overdue tasks" value={summary.overdue_tasks} />
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 text-sm font-bold text-slate-600 shadow-lg shadow-slate-900/5">
        Next deadline: {summary.next_deadline ? formatDisplayDate(summary.next_deadline) : 'None'}
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Upcoming and active work</h2>
        <div className="mt-4 grid gap-3">
          {tasks.length === 0 ? <EmptyAdminState message="No progress data is visible for your current role." /> : tasks.slice(0, 12).map((task) => (
            <Link key={task.id} href={`/staff/tasks/${task.id}`} className="rounded-md border border-slate-200 p-4 transition hover:border-uiussc-orange">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-uiussc-charcoal">{task.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{task.eventTitle} · {formatEventDate(task.eventDate)} · {task.departmentName}</p>
                </div>
                <div className="flex flex-wrap gap-2"><StatusBadge status={task.status} />{task.latestSubmissionStatus && <StatusBadge status={task.latestSubmissionStatus} />}</div>
              </div>
              <p className="mt-2 text-sm text-slate-600">{task.progressPercent}% progress · due {task.dueAt ? formatDisplayDate(task.dueAt) : 'not set'}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
