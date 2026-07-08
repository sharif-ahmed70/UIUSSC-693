import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminActionForm from '@/components/admin/AdminActionForm'
import AdminHeader from '@/components/admin/AdminHeader'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import StatusBadge from '@/components/admin/StatusBadge'
import {
  activateCommitteeAction,
  archiveCommitteeAction,
  assignCommitteeMemberAction,
  completeCommitteeAction,
  endCommitteeMemberAction,
} from '@/features/committees/actions'
import { getCommitteeDetail, getCommitteeSelectorData, groupCommitteeMembers } from '@/features/committees/queries'
import { getAdminContext } from '@/features/admin/queries/getAdminContext'
import { maskEmail } from '@/lib/formatters'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function CommitteeDetailPage({ params }: PageProps){
  const { id } = await params
  const [context, data, selectors] = await Promise.all([getAdminContext(), getCommitteeDetail(id), getCommitteeSelectorData()])

  if (!context.permissions.canViewCommittees) {
    notFound()
  }

  if (!data.committee) {
    notFound()
  }

  const activeMembers = data.members.filter((member) => member.status === 'active')
  const historicalMembers = data.members.filter((member) => member.status !== 'active')
  const grouped = groupCommitteeMembers(activeMembers)

  return (
    <div className="space-y-6">
      <AdminHeader title={data.committee.name} description={`Committee session ${data.committee.session_label}`} />

      {data.error && <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800" role="alert">Committee information is temporarily unavailable.</div>}

      <Link href="/admin/committees" className="inline-flex rounded-md border border-slate-200 px-3 py-2 text-sm font-extrabold text-uiussc-charcoal transition hover:border-uiussc-orange hover:text-uiussc-orange">
        Back to committees
      </Link>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-orange">{data.committee.session_label}</p>
            <h2 className="mt-2 text-2xl font-extrabold text-uiussc-charcoal">{data.committee.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{formatDate(data.committee.start_date)}{data.committee.end_date ? ` to ${formatDate(data.committee.end_date)}` : ' to present'}</p>
          </div>
          <StatusBadge status={data.committee.status} />
        </div>
      </section>

      {context.permissions.canManageCommittees && (
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <h2 className="text-xl font-extrabold text-uiussc-charcoal">Committee Actions</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {data.committee.status !== 'active' && data.committee.status !== 'archived' && (
              <ActionBox title="Activate" description="Make this the current public committee. Any existing active committee becomes historical.">
                <AdminActionForm action={activateCommitteeAction} id={data.committee.id} submitLabel="Activate committee" fields={<LabeledTextarea id="activate-reason" name="reason" label="Activation note" />} />
              </ActionBox>
            )}
            {data.committee.status !== 'completed' && data.committee.status !== 'archived' && (
              <ActionBox title="Complete" description="End active leadership assignments and preserve the committee as completed history.">
                <AdminActionForm action={completeCommitteeAction} id={data.committee.id} submitLabel="Complete committee" fields={<LabeledTextarea id="complete-reason" name="reason" label="Completion reason" required />} />
              </ActionBox>
            )}
            {data.committee.status !== 'archived' && (
              <ActionBox title="Archive" description="Move this committee into archived history. No records are deleted.">
                <AdminActionForm action={archiveCommitteeAction} id={data.committee.id} submitLabel="Archive committee" danger fields={<LabeledTextarea id="archive-reason" name="reason" label="Archive reason" required />} />
              </ActionBox>
            )}
          </div>
        </section>
      )}

      {context.permissions.canManageCommittees && data.committee.status !== 'archived' && data.committee.status !== 'completed' && (
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <h2 className="text-xl font-extrabold text-uiussc-charcoal">Assign Leadership</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Choose a member and an official position. Sensitive leadership changes are preserved in position history.</p>
          <div className="mt-4">
            <AdminActionForm action={assignCommitteeMemberAction} submitLabel="Assign leadership" fields={
              <div className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="committeeId" value={data.committee.id} />
                <label className="grid gap-2 text-sm font-bold text-slate-700" htmlFor="profileId">
                  Member
                  <select id="profileId" name="profileId" required className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900 focus:border-uiussc-orange focus:outline-none focus:ring-4 focus:ring-uiussc-orange/15">
                    <option value="">Search member</option>
                    {selectors.volunteers.map((volunteer) => <option key={volunteer.id} value={volunteer.id}>{volunteer.full_name} - {maskEmail(volunteer.email)}</option>)}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-700" htmlFor="positionId">
                  Position
                  <select id="positionId" name="positionId" required className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900 focus:border-uiussc-orange focus:outline-none focus:ring-4 focus:ring-uiussc-orange/15">
                    <option value="">Select position</option>
                    {selectors.positions.map((position) => <option key={position.id} value={position.id}>{position.name}</option>)}
                  </select>
                </label>
                <LabeledInput id="startDate" name="startDate" label="Start date" type="date" />
                <LabeledTextarea id="assign-reason" name="reason" label="Reason" />
              </div>
            } />
          </div>
        </section>
      )}

      <LeadershipSection title="Core Leadership" members={grouped.core} canManage={context.permissions.canManageCommittees} />
      <LeadershipSection title="Department Heads" members={grouped.departmentHeads} canManage={context.permissions.canManageCommittees} />
      <LeadershipSection title="Executive Members" members={grouped.executives} canManage={context.permissions.canManageCommittees} />
      <LeadershipSection title="Other Members" members={grouped.other} canManage={context.permissions.canManageCommittees} />

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Timeline</h2>
        <div className="mt-4 grid gap-3">
          {[...activeMembers, ...historicalMembers].length === 0 ? <EmptyAdminState message="No committee leadership history yet." /> : [...activeMembers, ...historicalMembers].map((member) => (
            <div key={member.id} className="rounded-md border border-slate-200 p-4">
              <p className="text-sm font-bold text-uiussc-orange">{formatDate(member.start_date)}</p>
              <h3 className="mt-1 font-extrabold text-uiussc-charcoal">{member.club_positions?.name ?? 'Position'}</h3>
              <p className="mt-1 text-sm text-slate-600">{member.volunteer_profiles?.full_name ?? 'Member'} - {member.status}</p>
              {member.end_date && <p className="mt-1 text-sm text-slate-600">Ended {formatDate(member.end_date)}</p>}
              {member.reason && <p className="mt-2 text-sm text-slate-500">Reason: {member.reason}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

type Member = Awaited<ReturnType<typeof getCommitteeDetail>>['members'][number]

function LeadershipSection({ title, members, canManage }: { title: string; members: Member[]; canManage: boolean }){
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
      <h2 className="text-xl font-extrabold text-uiussc-charcoal">{title}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {members.length === 0 ? <EmptyAdminState message={`No ${title.toLowerCase()} assigned yet.`} /> : members.map((member) => (
          <article key={member.id} className="rounded-md border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-uiussc-orange">{member.club_positions?.name ?? 'Position'}</p>
                <h3 className="mt-1 text-lg font-extrabold text-uiussc-charcoal">{member.volunteer_profiles?.full_name ?? 'Member'}</h3>
                <p className="mt-1 text-sm text-slate-600">Since {formatDate(member.start_date)}</p>
              </div>
              <StatusBadge status={member.status} />
            </div>
            {canManage && member.status === 'active' && (
              <div className="mt-4 rounded-md bg-slate-50 p-3">
                <AdminActionForm action={endCommitteeMemberAction} id={member.id} submitLabel="End assignment" danger fields={
                  <div className="grid gap-3">
                    <LabeledInput id={`end-date-${member.id}`} name="endDate" label="End date" type="date" required />
                    <LabeledTextarea id={`end-reason-${member.id}`} name="reason" label="Reason" required />
                  </div>
                } />
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

function ActionBox({ title, description, children }: { title: string; description: string; children: React.ReactNode }){
  return (
    <div className="rounded-md border border-slate-200 p-4">
      <h3 className="font-extrabold text-uiussc-charcoal">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function LabeledInput({ id, name, label, type = 'text', required }: { id: string; name: string; label: string; type?: string; required?: boolean }){
  return (
    <label htmlFor={id} className="grid gap-2 text-sm font-bold text-slate-700">
      <span>{label}{required ? <span className="text-uiussc-orange"> *</span> : null}</span>
      <input id={id} name={name} type={type} required={required} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900 focus:border-uiussc-orange focus:outline-none focus:ring-4 focus:ring-uiussc-orange/15" />
    </label>
  )
}

function LabeledTextarea({ id, name, label, required }: { id: string; name: string; label: string; required?: boolean }){
  return (
    <label htmlFor={id} className="grid gap-2 text-sm font-bold text-slate-700">
      <span>{label}{required ? <span className="text-uiussc-orange"> *</span> : null}</span>
      <textarea id={id} name={name} required={required} className="min-h-24 rounded-md border border-slate-200 p-3 text-sm font-normal text-slate-900 focus:border-uiussc-orange focus:outline-none focus:ring-4 focus:ring-uiussc-orange/15" />
    </label>
  )
}

function formatDate(value: string){
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value))
}
