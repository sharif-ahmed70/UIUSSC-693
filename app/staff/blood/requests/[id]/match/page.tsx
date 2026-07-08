import Link from 'next/link'
import { notFound } from 'next/navigation'
import BloodActionForm from '@/components/blood/BloodActionForm'
import { createBloodMatchAction } from '@/features/blood/actions'
import { getBloodCapabilities, getBloodRequestDetail, getPotentialBloodDonors } from '@/features/blood/queries'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import { hasOperationalOversight, requireApprovedVolunteer } from '@/lib/auth/authorization'

type BloodMatchPageProps = {
  params: Promise<{ id: string }>
}

export default async function BloodMatchPage({ params }: BloodMatchPageProps){
  const { id } = await params
  const access = await getStaffAccessContext()
  requireApprovedVolunteer(access)
  const isBloodMember = access.approvedMemberships.some((membership) => membership.department.slug === 'blood')

  if (!isBloodMember && !hasOperationalOversight(access)) {
    notFound()
  }

  const [detail, capabilities, donors] = await Promise.all([getBloodRequestDetail(id), getBloodCapabilities(), getPotentialBloodDonors(id)])

  if (!detail || !capabilities.canManageMatches) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <Link href={`/staff/blood/requests/${id}`} className="text-sm font-extrabold text-uiussc-green">Back to request</Link>
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-orange">Human-reviewed matching</p>
        <h1 className="mt-2 text-3xl font-extrabold text-uiussc-charcoal">Potential donors for {detail.request.public_reference_code}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Suggestions are based on blood group, location, and self-reported availability. These are potential donors only; human verification is required before contact.
        </p>
      </header>

      <section className="grid gap-4">
        {donors.map((donor) => (
          <article key={donor.id} className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-uiussc-charcoal">{donor.display_name}</h2>
                <p className="mt-2 text-sm text-slate-600">{donor.blood_group} · {donor.area ?? 'Area unknown'} · {donor.district ?? 'District unknown'}</p>
                <p className="mt-1 text-sm text-slate-600">Availability: {donor.availability_status.replace(/_/g, ' ')} · Last donation: {donor.self_reported_last_donation_date ?? 'not reported'}</p>
              </div>
              <div className="min-w-72">
                <BloodActionForm action={createBloodMatchAction} submitLabel="Suggest potential donor">
                  <input type="hidden" name="requestId" value={id} />
                  <input type="hidden" name="donorId" value={donor.id} />
                  <textarea name="notes" className="field text-sm" placeholder="Human review note" />
                </BloodActionForm>
              </div>
            </div>
          </article>
        ))}
        {donors.length === 0 && <p className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600">No potential donors matched this request filter.</p>}
      </section>
    </div>
  )
}
