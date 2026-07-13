import Link from 'next/link'
import { notFound } from 'next/navigation'
import BloodActionForm from '@/components/blood/BloodActionForm'
import { completeBloodAssignmentAction } from '@/features/blood/actions'
import { formatBloodPriority, formatBloodRequestStatus, priorityBadgeClass } from '@/features/blood/labels'
import { getBloodDashboardData } from '@/features/blood/queries'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import { hasOperationalOversight, requireApprovedVolunteer } from '@/lib/auth/authorization'
import { formatDisplayDate } from '@/lib/date'

export default async function BloodStaffPage(){
  const access = await getStaffAccessContext()
  requireApprovedVolunteer(access)
  const isBloodMember = access.approvedMemberships.some((membership) => membership.department.slug === 'blood')
  const canUseBloodWorkspace = isBloodMember || hasOperationalOversight(access)

  if (!canUseBloodWorkspace) {
    notFound()
  }

  const data = await getBloodDashboardData()

  return (
    <div className="space-y-6">
      <section className="rounded-md bg-uiussc-charcoal p-6 text-white shadow-xl shadow-slate-900/10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-orange">Blood Department</p>
        <h1 className="mt-3 text-3xl font-extrabold">Blood Support Operations</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Review requests, find potential donors, assign follow-up work, and confirm completed cases.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="rounded-md bg-white px-4 py-2 text-sm font-extrabold text-uiussc-charcoal" href="/staff/blood/requests">Manage Requests</Link>
          <Link className="rounded-md bg-white/10 px-4 py-2 text-sm font-extrabold text-white" href="/staff/blood/donors">Potential Donors</Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Critical Requests" value={data.requests.filter((request) => request.priority === 'critical').length} />
        <Metric label="Pending Review" value={data.requests.filter((request) => ['submitted', 'under_review'].includes(request.request_status)).length} />
        <Metric label="Donor Matching" value={data.matches.filter((match) => ['suggested', 'shortlisted', 'approved_for_contact', 'contacted', 'interested', 'confirmed'].includes(match.match_status)).length} />
        <Metric label="Completed Cases" value={data.requests.filter((request) => request.request_status === 'fulfilled').length} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <h2 className="text-xl font-extrabold text-uiussc-charcoal">{data.capabilities.canManageRequests ? 'Requests Needing Attention' : 'Blood Summary'}</h2>
          <div className="mt-4 grid gap-3">
            {data.requests.slice(0, 8).map((request) => (
              <Link key={request.id} href={`/staff/blood/requests/${request.id}`} className="rounded-md border border-slate-200 p-4 transition hover:border-uiussc-green">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-extrabold text-uiussc-charcoal">{request.public_reference_code}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${priorityBadgeClass(request.priority)}`}>{formatBloodPriority(request.priority)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{request.blood_group} - {request.hospital_name} - {formatDisplayDate(request.needed_at)}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{formatBloodRequestStatus(request.request_status)}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <h2 className="text-xl font-extrabold text-uiussc-charcoal">{data.capabilities.canManageRequests ? 'Blood Executive Follow-ups' : 'My Assigned Actions'}</h2>
          <div className="mt-4 grid gap-3">
            {data.assignments.length === 0 ? (
              <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">No active follow-up actions right now.</p>
            ) : data.assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-md border border-slate-200 p-4">
                <Link href={`/staff/blood/requests/${assignment.blood_request_id}`} className="font-extrabold text-uiussc-charcoal transition hover:text-uiussc-green">
                  {assignment.action_label ?? 'Follow up blood request'}
                </Link>
                <p className="mt-1 text-sm text-slate-600">{assignment.volunteer_profiles?.full_name ?? 'Assigned executive'} - Deadline: {assignment.due_at ? formatDisplayDate(assignment.due_at) : 'Not set'}</p>
                {!data.capabilities.canManageRequests && (
                  <div className="mt-3">
                    <BloodActionForm action={completeBloodAssignmentAction} submitLabel="Mark Complete">
                      <input type="hidden" name="requestId" value={assignment.blood_request_id} />
                      <input type="hidden" name="assignmentId" value={assignment.id} />
                      <input name="completionNote" className="field text-sm" placeholder="Short update" />
                    </BloodActionForm>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }){
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
      <p className="text-3xl font-extrabold text-uiussc-navy">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-600">{label}</p>
    </div>
  )
}
