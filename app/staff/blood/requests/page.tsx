import Link from 'next/link'
import { notFound } from 'next/navigation'
import { bloodRequestStatuses } from '@/features/blood/constants'
import { getBloodCapabilities, getBloodRequests } from '@/features/blood/queries'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import { hasOperationalOversight, requireApprovedVolunteer } from '@/lib/auth/authorization'
import { formatDisplayDate } from '@/lib/date'

type BloodRequestsPageProps = {
  searchParams: Promise<{ status?: string }>
}

export default async function BloodRequestsPage({ searchParams }: BloodRequestsPageProps){
  const access = await getStaffAccessContext()
  requireApprovedVolunteer(access)
  const isBloodMember = access.approvedMemberships.some((membership) => membership.department.slug === 'blood')

  if (!isBloodMember && !hasOperationalOversight(access)) {
    notFound()
  }

  const params = await searchParams
  const [capabilities, requests] = await Promise.all([getBloodCapabilities(), getBloodRequests(params.status)])

  if (!capabilities.canView && requests.length === 0) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-orange">Blood Support</p>
        <h1 className="mt-2 text-3xl font-extrabold text-uiussc-charcoal">Blood requests</h1>
      </header>

      <div className="flex flex-wrap gap-2">
        <Filter href="/staff/blood/requests" label="All" active={!params.status} />
        {bloodRequestStatuses.map((status) => (
          <Filter key={status} href={`/staff/blood/requests?status=${status}`} label={status.replace(/_/g, ' ')} active={params.status === status} />
        ))}
      </div>

      <section className="grid gap-4">
        {requests.map((request) => (
          <Link key={request.id} href={`/staff/blood/requests/${request.id}`} className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5 transition hover:border-uiussc-green">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-uiussc-charcoal">{request.public_reference_code}</h2>
                <p className="mt-2 text-sm text-slate-600">{request.blood_group} · {request.units_requested} unit(s) · {request.hospital_name}</p>
                <p className="mt-1 text-sm text-slate-600">{request.hospital_area ?? 'Area not specified'} · {request.district ?? 'District not specified'}</p>
              </div>
              <div className="text-right">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{request.request_status.replace(/_/g, ' ')}</span>
                <p className="mt-3 text-sm font-bold text-uiussc-navy">{request.urgency}</p>
                <p className="mt-1 text-sm text-slate-600">{formatDisplayDate(request.needed_at)}</p>
              </div>
            </div>
          </Link>
        ))}
        {requests.length === 0 && <p className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600">No blood requests found for this filter.</p>}
      </section>
    </div>
  )
}

function Filter({ href, label, active }: { href: string; label: string; active: boolean }){
  return (
    <Link href={href} className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${active ? 'bg-uiussc-navy text-white' : 'bg-white text-uiussc-charcoal ring-1 ring-slate-200 hover:ring-uiussc-green'}`}>
      {label}
    </Link>
  )
}
