import StatusBadge from '@/components/admin/StatusBadge'
import type { CommitteeMemberOverview as CommitteeMemberOverviewType } from '@/features/volunteer-dashboard/types'

export default function CommitteeOverview({ members }: { members: CommitteeMemberOverviewType[] }){
  const current = members.filter((member) => member.committeeStatus === 'active' || member.memberStatus === 'active')
  const historical = members.filter((member) => !current.some((item) => item.committeeId === member.committeeId && item.memberName === member.memberName && item.positionName === member.positionName))

  return (
    <section className="grid gap-5">
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-orange">Committee</p>
        <h2 className="mt-2 text-xl font-extrabold text-uiussc-charcoal">Current committee memberships</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {current.map((member) => (
            <article key={`${member.committeeId}-${member.memberName}-${member.positionName}`} className="rounded-md border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3"><h3 className="font-extrabold text-uiussc-charcoal">{member.memberName}</h3><StatusBadge status={member.memberStatus} /></div>
              <p className="mt-2 text-sm font-bold text-slate-700">{member.positionName}</p>
              <p className="mt-1 text-sm text-slate-500">{member.committeeName} / {member.sessionLabel}</p>
            </article>
          ))}
          {current.length === 0 && <p className="text-sm font-bold text-slate-600">No current committee memberships are visible.</p>}
        </div>
      </div>

      <details className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <summary className="cursor-pointer text-sm font-extrabold text-uiussc-charcoal">Historical committee entries ({historical.length})</summary>
        <div className="mt-4 grid gap-3">
          {historical.map((member) => (
            <div key={`${member.committeeId}-${member.memberName}-${member.positionName}-${member.startDate}`} className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
              <span className="font-extrabold text-uiussc-charcoal">{member.memberName}</span> / {member.positionName} / {member.committeeName}
            </div>
          ))}
        </div>
      </details>
    </section>
  )
}
