import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminActionForm from '@/components/admin/AdminActionForm'
import AdminHeader from '@/components/admin/AdminHeader'
import StatusBadge from '@/components/admin/StatusBadge'
import { assignDepartmentAction, changeAssignmentStatusAction, changeEventStatusAction, updateEventOperationAction } from '@/features/event-operations/actions'
import { getActiveDepartmentsForEventAssignments, getAdminEventOperation } from '@/features/event-operations/queries'
import { formatDisplayDate, formatEventDate } from '@/lib/date'

export default async function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }){
  const { id } = await params
  const [event, departments] = await Promise.all([getAdminEventOperation(id), getActiveDepartmentsForEventAssignments()])

  if (!event) notFound()

  return (
    <div>
      <Link href="/admin/events" className="mb-4 inline-flex text-sm font-bold text-uiussc-orange hover:text-[#e85d00]">Back to event operations</Link>
      <AdminHeader title={event.title} description={`${formatEventDate(event.eventDate)} · ${event.location}`} />

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <div className="flex flex-wrap gap-2"><StatusBadge status={event.operationalStatus} /><StatusBadge status={event.publicStatus} /></div>
          <h2 className="mt-4 text-xl font-extrabold text-uiussc-charcoal">Public event information</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{event.summary}</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{event.description}</p>
          {event.volunteerRequirements && <p className="mt-3 text-sm leading-6 text-slate-600"><span className="font-bold">Volunteer requirements:</span> {event.volunteerRequirements}</p>}
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <h2 className="text-xl font-extrabold text-uiussc-charcoal">Operational controls</h2>
          <AdminActionForm
            action={updateEventOperationAction}
            id={event.id}
            submitLabel="Update operation"
            fields={
              <div className="grid gap-3">
                <label htmlFor="internalSummary" className="grid gap-2 text-sm font-bold text-uiussc-charcoal">Internal summary
                  <textarea id="internalSummary" name="internalSummary" defaultValue={event.internalSummary ?? ''} className="min-h-24 rounded-md border border-slate-200 p-3 font-normal text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
                </label>
                <label htmlFor="planningStartAt" className="grid gap-2 text-sm font-bold text-uiussc-charcoal">Planning start
                  <input id="planningStartAt" name="planningStartAt" type="datetime-local" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 font-normal text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
                </label>
                <label htmlFor="operationalDeadline" className="grid gap-2 text-sm font-bold text-uiussc-charcoal">Operational deadline
                  <input id="operationalDeadline" name="operationalDeadline" type="datetime-local" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 font-normal text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
                </label>
              </div>
            }
          />
          <div className="mt-5 grid gap-3">
            {['planning', 'awaiting_approval', 'approved', 'published', 'active', 'completed'].map((status) => (
              <AdminActionForm key={status} action={changeEventStatusAction} id={event.id} submitLabel={`Set ${status.replaceAll('_', ' ')}`} fields={<input type="hidden" name="status" value={status} />} />
            ))}
            <AdminActionForm action={changeEventStatusAction} id={event.id} submitLabel="Request / perform cancellation" danger fields={<><input type="hidden" name="status" value="cancelled" /><textarea name="reason" required placeholder="Cancellation reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" /></>} />
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Department assignments</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-slate-200 p-4">
            <h3 className="font-extrabold text-uiussc-charcoal">Assign department</h3>
            <AdminActionForm
              action={assignDepartmentAction}
              id={event.id}
              submitLabel="Assign department"
              fields={
                <div className="grid gap-3">
                  <label htmlFor="departmentId" className="grid gap-2 text-sm font-bold text-uiussc-charcoal">Department
                    <select id="departmentId" name="departmentId" required className="min-h-10 rounded-md border border-slate-200 px-3 py-2 font-normal text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
                      <option value="">Select department</option>
                      {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                    </select>
                  </label>
                  <label htmlFor="isLeadDepartment" className="grid gap-2 text-sm font-bold text-uiussc-charcoal">Lead department
                    <select id="isLeadDepartment" name="isLeadDepartment" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 font-normal text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </label>
                  <input name="assignmentTitle" placeholder="Responsibility title" required className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
                  <textarea name="responsibilityBrief" placeholder="Responsibility brief" required className="min-h-24 rounded-md border border-slate-200 p-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
                  <input name="dueAt" type="datetime-local" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
                </div>
              }
            />
          </div>
          <div className="grid gap-3">
            {event.assignments.length === 0 ? <p className="rounded-md border border-slate-200 p-4 text-sm font-bold text-slate-600">No departments assigned yet.</p> : event.assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-md border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-extrabold text-uiussc-charcoal">{assignment.departmentName}</h3><StatusBadge status={assignment.assignmentStatus} /></div>
                <p className="mt-2 text-sm font-bold text-slate-700">{assignment.assignmentTitle}{assignment.isLeadDepartment ? ' · Lead' : ''}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{assignment.responsibilityBrief}</p>
                <p className="mt-2 text-xs font-bold text-slate-500">Due: {assignment.dueAt ? formatDisplayDate(assignment.dueAt) : 'Not set'}</p>
                <AdminActionForm action={changeAssignmentStatusAction} id={assignment.id} submitLabel="Update assignment status" fields={<><select name="status" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm"><option value="acknowledged">Acknowledged</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><textarea name="reason" placeholder="Reason for blocked or cancelled status" className="min-h-16 rounded-md border border-slate-200 p-3 text-sm" /></>} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Operation history</h2>
        <div className="mt-4 grid gap-3">
          {event.history.map((item) => (
            <div key={item.id} className="rounded-md border border-slate-200 px-4 py-3 text-sm text-slate-700">
              <span className="font-bold">{item.previousStatus ?? 'created'} → {item.newStatus}</span> · {formatDisplayDate(item.changedAt)}
              {item.reason && <p className="mt-1 text-slate-500">{item.reason}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
