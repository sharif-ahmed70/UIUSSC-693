import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminActionForm from '@/components/admin/AdminActionForm'
import AdminHeader from '@/components/admin/AdminHeader'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import StatusBadge from '@/components/admin/StatusBadge'
import { createEventTaskAction } from '@/features/event-tasks/actions'
import { getEligibleTaskAssignments, getEventTasksForOperation } from '@/features/event-tasks/queries'
import { getAdminEventOperation } from '@/features/event-operations/queries'
import { formatDisplayDate, formatEventDate } from '@/lib/date'

export default async function AdminEventTasksPage({ params }: { params: Promise<{ id: string }> }){
  const { id } = await params
  const [event, tasks, assignments] = await Promise.all([
    getAdminEventOperation(id),
    getEventTasksForOperation(id),
    getEligibleTaskAssignments(id),
  ])

  if (!event) notFound()

  return (
    <div>
      <Link href={`/admin/events/${id}`} className="mb-4 inline-flex text-sm font-bold text-uiussc-orange hover:text-[#e85d00]">Back to event operation</Link>
      <AdminHeader title={`${event.title} tasks`} description={`${formatEventDate(event.eventDate)} · department task breakdown`} />

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Create department task</h2>
        <div className="mt-4">
          <AdminActionForm
            action={createEventTaskAction}
            submitLabel="Create task"
            fields={
              <div className="grid gap-3">
                <label htmlFor="eventDepartmentAssignmentId" className="grid gap-2 text-sm font-bold text-uiussc-charcoal">Department assignment
                  <select id="eventDepartmentAssignmentId" name="eventDepartmentAssignmentId" required className="min-h-10 rounded-md border border-slate-200 px-3 py-2 font-normal text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
                    <option value="">Select assignment</option>
                    {assignments.map((assignment) => (
                      <option key={assignment.id} value={assignment.id}>{assignment.departmentName} - {assignment.assignmentTitle} - {assignment.assignmentStatus}</option>
                    ))}
                  </select>
                </label>
                <label htmlFor="title" className="grid gap-2 text-sm font-bold text-uiussc-charcoal">Task title
                  <input id="title" name="title" required className="min-h-10 rounded-md border border-slate-200 px-3 py-2 font-normal text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
                </label>
                <label htmlFor="description" className="grid gap-2 text-sm font-bold text-uiussc-charcoal">Description
                  <textarea id="description" name="description" required className="min-h-24 rounded-md border border-slate-200 p-3 font-normal text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label htmlFor="priority" className="grid gap-2 text-sm font-bold text-uiussc-charcoal">Priority
                    <select id="priority" name="priority" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 font-normal text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
                      <option value="normal">Normal</option>
                      <option value="low">Low</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </label>
                  <label htmlFor="dueAt" className="grid gap-2 text-sm font-bold text-uiussc-charcoal">Due date
                    <input id="dueAt" name="dueAt" type="datetime-local" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 font-normal text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
                  </label>
                </div>
              </div>
            }
          />
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600">
          {['All', 'Unassigned', 'Assigned', 'In progress', 'Blocked', 'Ready for review', 'Overdue'].map((filter) => (
            <span key={filter} className="rounded-md border border-slate-200 bg-white px-3 py-1.5">{filter}</span>
          ))}
        </div>
        {tasks.length === 0 ? <EmptyAdminState message="No department event tasks are visible yet." /> : tasks.map((task) => (
          <Link key={task.id} href={`/admin/events/${id}/tasks/${task.id}`} className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5 transition hover:border-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2"><StatusBadge status={task.status} /><StatusBadge status={task.priority} />{task.latestSubmissionStatus && <StatusBadge status={task.latestSubmissionStatus} />}</div>
                <h2 className="mt-3 text-xl font-extrabold text-uiussc-charcoal">{task.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{task.departmentName} · {task.assignmentTitle}</p>
              </div>
              <div className="text-sm text-slate-600 md:text-right">
                <p className="font-extrabold text-uiussc-charcoal">{task.progressPercent}% complete</p>
                <p className="mt-1">Primary: {task.primaryAssigneeName ?? 'Unassigned'}</p>
                <p className="mt-1">Contributors: {task.contributorCount}</p>
                <p className="mt-1">Due: {task.dueAt ? formatDisplayDate(task.dueAt) : 'Not set'}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}
