import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import BloodActionForm from '@/components/blood/BloodActionForm'
import {
  assignBloodExecutiveAction,
  recordBloodDonationAction,
  updateBloodMatchStatus,
  updateBloodRequestStatus,
  verifyBloodDonationAction,
} from '@/features/blood/actions'
import { getBloodCapabilities, getBloodExecutives, getBloodRequestDetail } from '@/features/blood/queries'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import { hasOperationalOversight, requireApprovedVolunteer } from '@/lib/auth/authorization'
import { formatDisplayDate } from '@/lib/date'

type BloodRequestDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function BloodRequestDetailPage({ params }: BloodRequestDetailPageProps){
  const { id } = await params
  const access = await getStaffAccessContext()
  requireApprovedVolunteer(access)
  const isBloodMember = access.approvedMemberships.some((membership) => membership.department.slug === 'blood')

  if (!isBloodMember && !hasOperationalOversight(access)) {
    notFound()
  }

  const [detail, capabilities, executives] = await Promise.all([getBloodRequestDetail(id), getBloodCapabilities(), getBloodExecutives()])

  if (!detail) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <Link href="/staff/blood/requests" className="text-sm font-extrabold text-uiussc-green">Back to requests</Link>

      <section className="rounded-md bg-uiussc-charcoal p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-orange">Blood request</p>
        <h1 className="mt-3 text-3xl font-extrabold">{detail.request.public_reference_code}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {detail.request.blood_group} · {detail.request.units_requested} unit(s) requested · {detail.request.units_fulfilled} fulfilled
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Info label="Status" value={detail.request.request_status.replace(/_/g, ' ')} />
        <Info label="Urgency" value={detail.request.urgency} />
        <Info label="Required" value={formatDisplayDate(detail.request.needed_at)} />
        <Info label="Hospital" value={detail.request.hospital_name} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold text-uiussc-charcoal">Potential donor matches</h2>
            {capabilities.canManageMatches && <Link href={`/staff/blood/requests/${id}/match`} className="rounded-md bg-uiussc-navy px-4 py-2 text-sm font-extrabold text-white">Find potential donors</Link>}
          </div>
          <div className="mt-4 grid gap-3">
            {detail.matches.map((match) => (
              <article key={match.id} className="rounded-md border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-uiussc-charcoal">{match.blood_donor_profiles?.display_name ?? 'Potential donor'}</h3>
                    <p className="mt-1 text-sm text-slate-600">{match.blood_donor_profiles?.blood_group} · {match.blood_donor_profiles?.area ?? 'Area unknown'} · {match.match_status.replace(/_/g, ' ')}</p>
                  </div>
                  {capabilities.canManageMatches && (
                    <BloodActionForm action={updateBloodMatchStatus} submitLabel="Update match">
                      <input type="hidden" name="requestId" value={id} />
                      <input type="hidden" name="matchId" value={match.id} />
                      <select name="status" className="field text-sm" defaultValue="">
                        <option value="" disabled>Status</option>
                        {['shortlisted', 'approved_for_contact', 'contacted', 'interested', 'declined', 'unavailable', 'confirmed', 'completed', 'cancelled'].map((status) => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
                      </select>
                      <input name="reason" className="field text-sm" placeholder="Reason or note" />
                    </BloodActionForm>
                  )}
                </div>
              </article>
            ))}
            {detail.matches.length === 0 && <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">No potential donors have been matched yet.</p>}
          </div>
        </div>

        <aside className="space-y-6">
          {capabilities.canManageRequests && (
            <Panel title="Request lifecycle">
              <BloodActionForm action={updateBloodRequestStatus} submitLabel="Update request">
                <input type="hidden" name="requestId" value={id} />
                <select name="status" className="field text-sm" defaultValue="">
                  <option value="" disabled>Status</option>
                  {['under_review', 'approved', 'matching', 'fulfilled', 'cancelled', 'rejected', 'archived'].map((status) => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
                </select>
                <textarea name="reason" className="field text-sm" placeholder="Reason when required" />
              </BloodActionForm>
            </Panel>
          )}

          {capabilities.canAssignExecutives && (
            <Panel title="Assign Blood executive">
              <BloodActionForm action={assignBloodExecutiveAction} submitLabel="Assign executive">
                <input type="hidden" name="requestId" value={id} />
                <select name="profileId" className="field text-sm" defaultValue="">
                  <option value="" disabled>Select executive</option>
                  {executives.map((executive) => <option key={executive.volunteer_profile_id} value={executive.volunteer_profile_id}>{executive.volunteer_profiles?.full_name ?? executive.volunteer_profile_id}</option>)}
                </select>
                <input name="reason" className="field text-sm" placeholder="Assignment reason" />
              </BloodActionForm>
            </Panel>
          )}
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Donation records">
          <div className="grid gap-3">
            {detail.donations.map((donation) => (
              <article key={donation.id} className="rounded-md border border-slate-200 p-4">
                <p className="font-extrabold text-uiussc-charcoal">{donation.reported_units} reported unit(s) · {donation.donation_status.replace(/_/g, ' ')}</p>
                <p className="mt-1 text-sm text-slate-600">{donation.donation_date ?? 'Donation date not recorded'}</p>
                {capabilities.canVerifyDonations && (
                  <div className="mt-3">
                    <BloodActionForm action={verifyBloodDonationAction} submitLabel="Verify donation">
                      <input type="hidden" name="requestId" value={id} />
                      <input type="hidden" name="donationId" value={donation.id} />
                      <input name="verifiedUnits" type="number" min="0" max={donation.reported_units} className="field text-sm" placeholder="Verified units" />
                      <select name="status" className="field text-sm" defaultValue="verified">
                        <option value="verified">verified</option>
                        <option value="rejected">rejected</option>
                      </select>
                      <input name="reason" className="field text-sm" placeholder="Reason if rejected" />
                    </BloodActionForm>
                  </div>
                )}
              </article>
            ))}
          </div>
          {capabilities.canManageMatches && (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <BloodActionForm action={recordBloodDonationAction} submitLabel="Record donation">
                <input type="hidden" name="requestId" value={id} />
                <select name="donorId" className="field text-sm" defaultValue="">
                  <option value="" disabled>Matched donor</option>
                  {detail.matches.map((match) => <option key={match.id} value={match.donor_profile_id}>{match.blood_donor_profiles?.display_name ?? match.donor_profile_id}</option>)}
                </select>
                <select name="matchId" className="field text-sm" defaultValue="">
                  <option value="">No match link</option>
                  {detail.matches.map((match) => <option key={match.id} value={match.id}>{match.blood_donor_profiles?.display_name ?? match.id}</option>)}
                </select>
                <input name="reportedUnits" type="number" min="1" className="field text-sm" placeholder="Reported units" />
                <input name="donationDate" type="date" className="field text-sm" />
                <input name="hospitalReference" className="field text-sm" placeholder="Hospital reference" />
              </BloodActionForm>
            </div>
          )}
        </Panel>

        <Panel title="Status history">
          <div className="grid gap-3">
            {detail.history.map((item) => (
              <div key={item.id} className="rounded-md border border-slate-200 p-4">
                <p className="font-extrabold text-uiussc-charcoal">{item.previous_status ?? 'new'} → {item.new_status}</p>
                <p className="mt-1 text-sm text-slate-600">{formatDisplayDate(item.changed_at)} · {item.reason ?? 'No reason recorded'}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }){
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 font-extrabold text-uiussc-charcoal">{value}</p>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }){
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
      <h2 className="text-xl font-extrabold text-uiussc-charcoal">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}
