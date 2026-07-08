import Link from 'next/link'
import { notFound } from 'next/navigation'
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
          Role-aware workspace for request review, potential donor matching, controlled contact workflow, and donation verification.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="rounded-md bg-white px-4 py-2 text-sm font-extrabold text-uiussc-charcoal" href="/staff/blood/requests">Manage requests</Link>
          <Link className="rounded-md bg-white/10 px-4 py-2 text-sm font-extrabold text-white" href="/staff/blood/donors">Potential donors</Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Active requests" value={data.requests.filter((request) => !['fulfilled', 'cancelled', 'rejected', 'expired', 'archived'].includes(request.request_status)).length} />
        <Metric label="Pending verification" value={data.donations.filter((donation) => ['reported', 'under_review'].includes(donation.donation_status)).length} />
        <Metric label="Matching queue" value={data.matches.filter((match) => ['suggested', 'shortlisted', 'approved_for_contact', 'contacted', 'interested', 'confirmed'].includes(match.match_status)).length} />
        <Metric label="Verified donations" value={data.donations.filter((donation) => donation.donation_status === 'verified').length} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <h2 className="text-xl font-extrabold text-uiussc-charcoal">Active blood requests</h2>
          <div className="mt-4 grid gap-3">
            {data.requests.slice(0, 8).map((request) => (
              <Link key={request.id} href={`/staff/blood/requests/${request.id}`} className="rounded-md border border-slate-200 p-4 transition hover:border-uiussc-green">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-extrabold text-uiussc-charcoal">{request.public_reference_code}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{request.request_status.replace(/_/g, ' ')}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{request.blood_group} · {request.hospital_name} · {formatDisplayDate(request.needed_at)}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <h2 className="text-xl font-extrabold text-uiussc-charcoal">{data.capabilities.canManageRequests ? 'Department activity' : 'Assigned follow-up work'}</h2>
          <div className="mt-4 grid gap-3">
            {data.assignments.length === 0 ? <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">No active Blood executive assignments found.</p> : data.assignments.map((assignment) => (
              <Link key={assignment.id} href={`/staff/blood/requests/${assignment.blood_request_id}`} className="rounded-md border border-slate-200 p-4 transition hover:border-uiussc-green">
                <h3 className="font-extrabold text-uiussc-charcoal">{assignment.volunteer_profiles?.full_name ?? 'Assigned executive'}</h3>
                <p className="mt-1 text-sm text-slate-600">Request follow-up · {assignment.assignment_status}</p>
              </Link>
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
