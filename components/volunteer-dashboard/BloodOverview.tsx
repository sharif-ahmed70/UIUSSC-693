import StatusBadge from '@/components/admin/StatusBadge'
import type { BloodAssignmentOverview as BloodAssignmentOverviewType } from '@/features/volunteer-dashboard/types'
import { formatDisplayDate } from '@/lib/date'

export default function BloodOverview({ assignments }: { assignments: BloodAssignmentOverviewType[] }){
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-orange">Blood Support</p>
      <h2 className="mt-2 text-xl font-extrabold text-uiussc-charcoal">Read-only donor and request assignments</h2>
      <div className="mt-5 grid gap-3">
        {assignments.map((assignment) => (
          <article key={assignment.assignmentId} className="rounded-md border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-uiussc-charcoal">{assignment.bloodGroup} / {assignment.hospitalName}</h3>
                <p className="mt-1 text-sm text-slate-600">{assignment.actionLabel ?? 'Blood support follow-up'} assigned to {assignment.assignedTo}</p>
              </div>
              <StatusBadge status={assignment.assignmentStatus} />
            </div>
            <p className="mt-3 text-xs font-bold text-slate-500">Needed: {formatDisplayDate(assignment.neededAt)}{assignment.dueAt ? ` / Due: ${formatDisplayDate(assignment.dueAt)}` : ''}</p>
          </article>
        ))}
        {assignments.length === 0 && <p className="text-sm font-bold text-slate-600">No blood support assignments are visible for your current role.</p>}
      </div>
    </section>
  )
}
