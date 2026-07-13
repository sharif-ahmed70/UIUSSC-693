import { notFound } from 'next/navigation'
import BloodActionForm from '@/components/blood/BloodActionForm'
import { updateBloodDonorAvailability } from '@/features/blood/actions'
import { bloodGroups } from '@/features/blood/constants'
import { formatBloodAvailability } from '@/features/blood/labels'
import { getBloodCapabilities, getBloodDonors } from '@/features/blood/queries'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import { hasOperationalOversight, requireApprovedVolunteer } from '@/lib/auth/authorization'

type BloodDonorsPageProps = {
  searchParams: Promise<{ bloodGroup?: string; availability?: string; location?: string }>
}

const availabilityOptions = ['unknown', 'available', 'temporarily_unavailable', 'unavailable', 'do_not_contact']

export default async function BloodDonorsPage({ searchParams }: BloodDonorsPageProps){
  const access = await getStaffAccessContext()
  requireApprovedVolunteer(access)
  const isBloodMember = access.approvedMemberships.some((membership) => membership.department.slug === 'blood')

  if (!isBloodMember && !hasOperationalOversight(access)) {
    notFound()
  }

  const [params, capabilities] = await Promise.all([searchParams, getBloodCapabilities()])

  if (!capabilities.canManageDonors) {
    notFound()
  }

  const donors = await getBloodDonors(params)

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-orange">Blood Support</p>
        <h1 className="mt-2 text-3xl font-extrabold text-uiussc-charcoal">Potential Donors</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Private phone and email details are not shown here. Contact access stays inside the approved match workflow.</p>
      </header>

      <form className="grid gap-3 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5 md:grid-cols-4">
        <select name="bloodGroup" className="field" defaultValue={params.bloodGroup ?? ''}>
          <option value="">All blood groups</option>
          {bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
        </select>
        <select name="availability" className="field" defaultValue={params.availability ?? ''}>
          <option value="">All availability</option>
          {availabilityOptions.map((status) => <option key={status} value={status}>{formatBloodAvailability(status)}</option>)}
        </select>
        <input name="location" className="field" defaultValue={params.location ?? ''} placeholder="Area or district" />
        <button type="submit" className="rounded-md bg-uiussc-navy px-4 py-2 text-sm font-extrabold text-white">Filter</button>
      </form>

      <section className="grid gap-4 md:grid-cols-2">
        {donors.map((donor) => (
          <article key={donor.id} className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-extrabold text-uiussc-charcoal">{donor.display_name}</h2>
                <p className="mt-2 text-sm text-slate-600">{donor.blood_group} - {donor.area ?? 'Area unknown'} - {donor.district ?? 'District unknown'}</p>
                <p className="mt-1 text-sm text-slate-600">Last donation: {donor.self_reported_last_donation_date ?? 'not reported'}</p>
              </div>
              <div className="text-right">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{formatBloodAvailability(donor.availability_status)}</span>
                <p className="mt-3 text-xs font-bold text-slate-500">{donor.verification_status.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <div className="mt-4 border-t border-slate-200 pt-4">
              <BloodActionForm action={updateBloodDonorAvailability} submitLabel="Update Availability">
                <input type="hidden" name="donorId" value={donor.id} />
                <select name="availabilityStatus" className="field text-sm" defaultValue={donor.availability_status}>
                  {availabilityOptions.map((status) => <option key={status} value={status}>{formatBloodAvailability(status)}</option>)}
                </select>
                <input name="reason" className="field text-sm" placeholder="Reason when needed" />
              </BloodActionForm>
            </div>
          </article>
        ))}
        {donors.length === 0 && <p className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600">No potential donors found.</p>}
      </section>
    </div>
  )
}
