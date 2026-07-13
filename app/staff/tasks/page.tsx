import Link from 'next/link'
import AdminStatCard from '@/components/admin/AdminStatCard'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import StatusBadge from '@/components/admin/StatusBadge'
import { getStaffTasks } from '@/features/event-tasks/queries'
import { formatDisplayDate, formatEventDate } from '@/lib/date'

export default async function StaffTasksPage(){
  const tasks = await getStaffTasks()
  const active = tasks.filter((task) => !['completed', 'cancelled'].includes(task.status)).length
  const overdue = tasks.filter((task) => task.dueAt && new Date(task.dueAt).getTime() < Date.now() && !['completed', 'cancelled'].includes(task.status)).length
  const ready = tasks.filter((task) => task.progressPercent === 100 && !task.latestSubmissionStatus && !['completed', 'cancelled'].includes(task.status)).length
  const underReview = tasks.filter((task) => task.latestSubmissionStatus === 'submitted' || task.latestSubmissionStatus === 'under_review').length
  const revision = tasks.filter((task) => task.latestSubmissionStatus === 'revision_requested').length
  const completed = tasks.filter((task) => task.status === 'completed').length

  return (
    <div className="space-y-6">
      <section className="rounded-md bg-uiussc-charcoal p-6 text-white shadow-xl shadow-slate-900/10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-orange">Department Event Tasks</p>
        <h1 className="mt-3 text-3xl font-extrabold">Tasks</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Operational tasks visible through your assigned event, department, or leadership access.</p>
      </section>

      <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600">
        {['All', 'Assigned to me', 'In progress', 'Blocked', 'Ready for review', 'Overdue'].map((filter) => (
          <span key={filter} className="rounded-md border border-slate-200 bg-white px-3 py-1.5">{filter}</span>
        ))}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <AdminStatCard label="Active" value={active} />
        <AdminStatCard label="Overdue" value={overdue} />
        <AdminStatCard label="Ready to submit" value={ready} />
        <AdminStatCard label="Under review" value={underReview} />
        <AdminStatCard label="Revision requested" value={revision} />
        <AdminStatCard label="Completed" value={completed} />
      </section>

      <section className="grid gap-4">
        {tasks.length === 0 ? <EmptyAdminState message="No event tasks are visible for your current role." /> : tasks.map((task) => (
          <Link key={task.id} href={`/staff/tasks/${task.id}`} className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5 transition hover:border-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2"><StatusBadge status={task.status} /><StatusBadge status={task.priority} />{task.latestSubmissionStatus && <StatusBadge status={task.latestSubmissionStatus} />}</div>
                <h2 className="mt-3 text-xl font-extrabold text-uiussc-charcoal">{task.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{task.eventTitle} · {formatEventDate(task.eventDate)}</p>
                <p className="mt-1 text-sm text-slate-600">{task.departmentName} · {task.assignmentTitle}</p>
              </div>
              <div className="text-sm text-slate-600 md:text-right">
                <p className="font-extrabold text-uiussc-charcoal">{task.progressPercent}%</p>
                <p className="mt-1">Primary: {task.primaryAssigneeName ?? 'Unassigned'}</p>
                <p className="mt-1">Due: {task.dueAt ? formatDisplayDate(task.dueAt) : 'Not set'}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}
