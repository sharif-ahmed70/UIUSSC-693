import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminActionForm from '@/components/admin/AdminActionForm'
import AdminHeader from '@/components/admin/AdminHeader'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import StatusBadge from '@/components/admin/StatusBadge'
import { createCommitteeAction } from '@/features/committees/actions'
import { getCommitteeDashboard, groupCommitteeMembers } from '@/features/committees/queries'
import { getAdminContext } from '@/features/admin/queries/getAdminContext'

export default async function CommitteesPage(){
  const [context, data] = await Promise.all([getAdminContext(), getCommitteeDashboard()])

  if (!context.permissions.canViewCommittees) {
    notFound()
  }

  const activeCommittee = data.committees.find((committee) => committee.status === 'active') ?? null
  const previousCommittees = data.committees.filter((committee) => committee.status !== 'active')
  const activeMembers = activeCommittee ? data.members.filter((member) => member.committee_id === activeCommittee.id && member.status === 'active') : []
  const grouped = groupCommitteeMembers(activeMembers)

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Committee Management"
        description="Manage yearly UIUSSC committees, leadership assignments, and historical leadership records."
      />

      {data.error && <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800" role="alert">Committee information is temporarily unavailable.</div>}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Current committee" value={activeCommittee ? '1' : '0'} />
        <SummaryCard label="Committee members" value={String(activeMembers.length)} />
        <SummaryCard label="Previous committees" value={String(previousCommittees.length)} />
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-uiussc-charcoal">Current Committee</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">The active committee is shown publicly on the team page.</p>
          </div>
          {activeCommittee && (
            <Link href={`/admin/committees/${activeCommittee.id}`} className="rounded-md bg-uiussc-orange px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#e85d00]">
              Open committee
            </Link>
          )}
        </div>

        {!activeCommittee ? (
          <div className="mt-4"><EmptyAdminState message="No active committee yet. Create a draft committee, assign leadership, then activate it." /></div>
        ) : (
          <div className="mt-5 grid gap-4">
            <CommitteeHeader committee={activeCommittee} />
            <LeadershipPreview title="Core Leadership" members={grouped.core} />
            <LeadershipPreview title="Department Leadership" members={grouped.departmentHeads} />
          </div>
        )}
      </section>

      {context.permissions.canManageCommittees && (
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <h2 className="text-xl font-extrabold text-uiussc-charcoal">Create Committee</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Create a draft yearly committee before assigning leadership.</p>
          <div className="mt-4">
            <AdminActionForm action={createCommitteeAction} submitLabel="Create committee" fields={
              <div className="grid gap-4 md:grid-cols-2">
                <LabeledInput id="committee-name" name="name" label="Committee name" placeholder="UIUSSC Executive Committee 2026-27" required />
                <LabeledInput id="committee-session" name="sessionLabel" label="Session" placeholder="2026-27" required />
                <LabeledInput id="committee-start" name="startDate" label="Start date" type="date" required />
                <LabeledInput id="committee-end" name="endDate" label="End date" type="date" />
              </div>
            } />
          </div>
        </section>
      )}

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Previous Committees</h2>
        <div className="mt-4 grid gap-3">
          {previousCommittees.length === 0 ? <EmptyAdminState message="No previous committees yet." /> : previousCommittees.map((committee) => (
            <Link key={committee.id} href={`/admin/committees/${committee.id}`} className="rounded-md border border-slate-200 p-4 transition hover:border-uiussc-orange">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-uiussc-charcoal">{committee.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{committee.session_label} - {formatDate(committee.start_date)}{committee.end_date ? ` to ${formatDate(committee.end_date)}` : ''}</p>
                </div>
                <StatusBadge status={committee.status} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

type Committee = Awaited<ReturnType<typeof getCommitteeDashboard>>['committees'][number]
type Member = Awaited<ReturnType<typeof getCommitteeDashboard>>['members'][number]

function CommitteeHeader({ committee }: { committee: Committee }){
  return (
    <div className="rounded-md bg-uiussc-charcoal p-5 text-white">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-orange">{committee.session_label}</p>
      <h3 className="mt-2 text-2xl font-extrabold">{committee.name}</h3>
      <p className="mt-2 text-sm text-white/80">{formatDate(committee.start_date)}{committee.end_date ? ` to ${formatDate(committee.end_date)}` : ' to present'}</p>
    </div>
  )
}

function LeadershipPreview({ title, members }: { title: string; members: Member[] }){
  return (
    <div>
      <h3 className="font-extrabold text-uiussc-charcoal">{title}</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {members.length === 0 ? <EmptyAdminState message={`No ${title.toLowerCase()} assigned yet.`} /> : members.map((member) => (
          <div key={member.id} className="rounded-md border border-slate-200 p-4">
            <p className="text-sm font-bold text-uiussc-orange">{member.club_positions?.name ?? 'Position'}</p>
            <p className="mt-1 text-lg font-extrabold text-uiussc-charcoal">{member.volunteer_profiles?.full_name ?? 'Member'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }){
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-orange">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-uiussc-charcoal">{value}</p>
    </div>
  )
}

function LabeledInput({ id, name, label, type = 'text', placeholder, required }: { id: string; name: string; label: string; type?: string; placeholder?: string; required?: boolean }){
  return (
    <label htmlFor={id} className="grid gap-2 text-sm font-bold text-slate-700">
      <span>{label}{required ? <span className="text-uiussc-orange"> *</span> : null}</span>
      <input id={id} name={name} type={type} placeholder={placeholder} required={required} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900 focus:border-uiussc-orange focus:outline-none focus:ring-4 focus:ring-uiussc-orange/15" />
    </label>
  )
}

function formatDate(value: string){
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value))
}
