import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import BloodActionForm from '@/components/blood/BloodActionForm'
import {
  assignBloodExecutiveAction,
  completeBloodAssignmentAction,
  recordBloodDonationAction,
  updateBloodMatchStatus,
  updateBloodRequestPriority,
  updateBloodRequestStatus,
  verifyBloodDonationAction,
} from '@/features/blood/actions'
import {
  formatBloodDonationStatus,
  formatBloodMatchStatus,
  formatBloodPriority,
  formatBloodRequestStatus,
  priorityBadgeClass,
} from '@/features/blood/labels'
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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-orange">Blood request</p>
            <h1 className="mt-3 text-3xl font-extrabold">{detail.request.public_reference_code}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {detail.request.blood_group} - {detail.request.units_requested} unit(s) requested - {detail.request.units_fulfilled} fulfilled
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${priorityBadgeClass(detail.request.priority)}`}>
            {formatBloodPriority(detail.request.priority)}
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Info label="Stage" value={formatBloodRequestStatus(detail.request.request_status)} />
        <Info label="Priority" value={formatBloodPriority(detail.request.priority)} />
        <Info label="Required" value={formatDisplayDate(detail.request.needed_at)} />
        <Info label="Hospital" value={detail.request.hospital_name} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Panel title="Potential Donors" className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">Human review is required before contact.</p>
            {capabilities.canManageMatches && <Link href={`/staff/blood/requests/${id}/match`} className="rounded-md bg-uiussc-navy px-4 py-2 text-sm font-extrabold text-white">Find Potential Donors</Link>}
          </div>
          <div className="mt-4 grid gap-3">
            {detail.matches.map((match) => (
              <article key={match.id} className="rounded-md border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-uiussc-charcoal">{match.blood_donor_profiles?.display_name ?? 'Potential donor'}</h3>
                    <p className="mt-1 text-sm text-slate-600">{match.blood_donor_profiles?.blood_group} - {match.blood_donor_profiles?.area ?? 'Area unknown'} - {formatBloodMatchStatus(match.match_status)}</p>
                  </div>
                  {capabilities.canManageMatches && (
                    <BloodActionForm action={updateBloodMatchStatus} submitLabel="Save Contact Update">
                      <input type="hidden" name="requestId" value={id} />
                      <input type="hidden" name="matchId" value={match.id} />
                      <select name="status" className="field text-sm" defaultValue="">
                        <option value="" disabled>Choose next step</option>
                        {['shortlisted', 'approved_for_contact', 'contacted', 'interested', 'declined', 'unavailable', 'confirmed', 'completed', 'cancelled'].map((status) => <option key={status} value={status}>{formatBloodMatchStatus(status)}</option>)}
                      </select>
                      <input name="reason" className="field text-sm" placeholder="Short note" />
                    </BloodActionForm>
                  )}
                </div>
              </article>
            ))}
            {detail.matches.length === 0 && <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">No potential donors have been added yet.</p>}
          </div>
        </Panel>

        <aside className="space-y-6">
          {capabilities.canManageRequests && (
            <Panel title="Review Request">
              <BloodActionForm action={updateBloodRequestStatus} submitLabel="Save Review">
                <input type="hidden" name="requestId" value={id} />
                <select name="status" className="field text-sm" defaultValue="">
                  <option value="" disabled>Choose action</option>
                  <option value="under_review">Start Review</option>
                  <option value="approved">Verify Request</option>
                  <option value="matching">Start Donor Search</option>
                  <option value="fulfilled">Mark Completed</option>
                  <option value="rejected">Reject Request</option>
                  <option value="cancelled">Cancel Request</option>
                </select>
                <textarea name="reason" className="field text-sm" placeholder="Note or reason" />
              </BloodActionForm>
            </Panel>
          )}

          {capabilities.canManageRequests && (
            <Panel title="Change Priority">
              <BloodActionForm action={updateBloodRequestPriority} submitLabel="Update Priority">
                <input type="hidden" name="requestId" value={id} />
                <select name="priority" className="field text-sm" defaultValue={detail.request.priority ?? 'normal'}>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>
                <input name="reason" className="field text-sm" placeholder="Why is this changing?" required />
              </BloodActionForm>
            </Panel>
          )}

          {capabilities.canAssignExecutives && (
            <Panel title="Assign Follow-up">
              <BloodActionForm action={assignBloodExecutiveAction} submitLabel="Assign Action">
                <input type="hidden" name="requestId" value={id} />
                <select name="profileId" className="field text-sm" defaultValue="">
                  <option value="" disabled>Select Blood Executive</option>
                  {executives.map((executive) => <option key={executive.volunteer_profile_id} value={executive.volunteer_profile_id}>{executive.volunteer_profiles?.full_name ?? executive.volunteer_profile_id}</option>)}
                </select>
                <select name="actionLabel" className="field text-sm" defaultValue="Contact donor">
                  <option value="Contact donor">Contact donor</option>
                  <option value="Confirm availability">Confirm availability</option>
                  <option value="Hospital coordination">Hospital coordination</option>
                  <option value="Follow up patient">Follow up patient</option>
                </select>
                <input name="dueAt" type="datetime-local" className="field text-sm" />
                <input name="reason" className="field text-sm" placeholder="Instruction note" />
              </BloodActionForm>
            </Panel>
          )}
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Assigned Actions">
          <div className="grid gap-3">
            {detail.assignments.map((assignment) => (
              <article key={assignment.id} className="rounded-md border border-slate-200 p-4">
                <p className="font-extrabold text-uiussc-charcoal">{assignment.action_label ?? 'Follow up blood request'}</p>
                <p className="mt-1 text-sm text-slate-600">{assignment.volunteer_profiles?.full_name ?? 'Blood Executive'} - Deadline: {assignment.due_at ? formatDisplayDate(assignment.due_at) : 'Not set'}</p>
                <div className="mt-3">
                  <BloodActionForm action={completeBloodAssignmentAction} submitLabel="Mark Complete">
                    <input type="hidden" name="requestId" value={id} />
                    <input type="hidden" name="assignmentId" value={assignment.id} />
                    <input name="completionNote" className="field text-sm" placeholder="Short update" />
                  </BloodActionForm>
                </div>
              </article>
            ))}
            {detail.assignments.length === 0 && <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">No follow-up actions assigned yet.</p>}
          </div>
        </Panel>

        <Panel title="Donation History">
          <div className="grid gap-3">
            {detail.donations.map((donation) => (
              <article key={donation.id} className="rounded-md border border-slate-200 p-4">
                <p className="font-extrabold text-uiussc-charcoal">{donation.donation_date ?? 'Date not recorded'}</p>
                <p className="mt-1 text-sm text-slate-600">{detail.request.blood_group} - {donation.hospital_reference ?? detail.request.hospital_name} - {formatBloodDonationStatus(donation.donation_status)}</p>
                {capabilities.canVerifyDonations && (
                  <div className="mt-3">
                    <BloodActionForm action={verifyBloodDonationAction} submitLabel="Verify Donation">
                      <input type="hidden" name="requestId" value={id} />
                      <input type="hidden" name="donationId" value={donation.id} />
                      <input name="verifiedUnits" type="number" min="0" max={donation.reported_units} className="field text-sm" placeholder="Verified units" />
                      <select name="status" className="field text-sm" defaultValue="verified">
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
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
              <BloodActionForm action={recordBloodDonationAction} submitLabel="Record Completed Donation">
                <input type="hidden" name="requestId" value={id} />
                <select name="donorId" className="field text-sm" defaultValue="">
                  <option value="" disabled>Matched donor</option>
                  {detail.matches.map((match) => <option key={match.id} value={match.donor_profile_id}>{match.blood_donor_profiles?.display_name ?? match.donor_profile_id}</option>)}
                </select>
                <select name="matchId" className="field text-sm" defaultValue="">
                  <option value="">No match link</option>
                  {detail.matches.map((match) => <option key={match.id} value={match.id}>{match.blood_donor_profiles?.display_name ?? match.id}</option>)}
                </select>
                <input name="reportedUnits" type="number" min="1" className="field text-sm" placeholder="Completed units" />
                <input name="donationDate" type="date" className="field text-sm" />
                <input name="hospitalReference" className="field text-sm" placeholder="Hospital reference" />
              </BloodActionForm>
            </div>
          )}
        </Panel>
      </section>

      <Panel title="Request Timeline">
        <div className="grid gap-3">
          {detail.timeline.map((item) => (
            <div key={item.id} className="rounded-md border border-slate-200 p-4">
              <p className="text-sm font-bold text-uiussc-green">{formatDisplayDate(item.at)}</p>
              <h3 className="mt-1 font-extrabold text-uiussc-charcoal">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
            </div>
          ))}
        </div>
      </Panel>
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

function Panel({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }){
  return (
    <section className={`rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5 ${className}`}>
      <h2 className="text-xl font-extrabold text-uiussc-charcoal">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}
