import AdminActionForm from '@/components/admin/AdminActionForm'
import StatusBadge from '@/components/admin/StatusBadge'
import { changeAssignmentStatusAction } from '@/features/event-operations/actions'
import { getStaffAssignedEvents } from '@/features/event-operations/queries'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import { formatDisplayDate, formatEventDate } from '@/lib/date'

export default async function StaffAssignedEventsPage(){
  const [access, assignments] = await Promise.all([getStaffAccessContext(), getStaffAssignedEvents()])
  const canUpdateAssignments = access.platformRoles.includes('super_admin') || access.platformRoles.includes('club_admin') || access.approvedMemberships.some((membership) => membership.role === 'department_head' || membership.role === 'deputy_head')

  return (
    <div className="space-y-6">
      <section className="rounded-md bg-uiussc-charcoal p-6 text-white shadow-xl shadow-slate-900/10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-orange">Event assignments</p>
        <h1 className="mt-3 text-3xl font-extrabold">Assigned events</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Department-scoped event responsibilities visible to your approved UIUSSC access.</p>
      </section>

      <section className="grid gap-4">
        {assignments.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-white p-5 text-sm font-bold text-slate-600 shadow-lg shadow-slate-900/5">
            No assigned event responsibilities are visible for your current role.
          </div>
        ) : assignments.map((assignment) => (
          <article key={assignment.id} className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-orange">{assignment.departmentName}{assignment.isLeadDepartment ? ' · Lead department' : ''}</p>
                <h2 className="mt-2 text-xl font-extrabold text-uiussc-charcoal">{assignment.eventTitle}</h2>
              </div>
              <div className="flex flex-wrap gap-2"><StatusBadge status={assignment.assignmentStatus} /><StatusBadge status={assignment.operationalStatus} /></div>
            </div>
            <p className="mt-3 text-sm text-slate-600">{formatEventDate(assignment.eventDate)} · {assignment.eventLocation}</p>
            <p className="mt-3 text-sm font-bold text-slate-700">{assignment.assignmentTitle}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{assignment.responsibilityBrief}</p>
            <p className="mt-2 text-xs font-bold text-slate-500">Due: {assignment.dueAt ? formatDisplayDate(assignment.dueAt) : 'Not set'}</p>
            {canUpdateAssignments && (
              <div className="mt-4 max-w-md">
                <AdminActionForm
                  action={changeAssignmentStatusAction}
                  id={assignment.id}
                  submitLabel="Update status"
                  fields={
                    <>
                      <select name="status" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
                        <option value="acknowledged">Acknowledged</option>
                        <option value="in_progress">In progress</option>
                        <option value="blocked">Blocked</option>
                        <option value="completed">Completed</option>
                      </select>
                      <textarea name="reason" placeholder="Reason for blocked status" className="min-h-16 rounded-md border border-slate-200 p-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
                    </>
                  }
                />
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  )
}
