import Link from 'next/link'
import PageHeader from '@/components/PageHeader'
import EmptyState from '@/components/states/EmptyState'
import { getActiveCommitteePublic, groupPublicCommitteeMembers } from '@/features/committees/queries'

export default async function TeamPage(){
  const { members, error } = await getActiveCommitteePublic()
  const committee = members[0] ?? null
  const grouped = groupPublicCommitteeMembers(members)

  return (
    <main>
      <PageHeader
        title="UIUSSC Committee"
        subtitle="Meet the current leadership team serving United International University Social Services Club."
      />

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {error && <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">Current committee information is temporarily unavailable.</div>}

          {!committee ? (
            <EmptyState title="Committee will be published soon" description="The active UIUSSC committee is not published yet." />
          ) : (
            <div className="space-y-10">
              <div className="rounded-md bg-uiussc-navy p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-green">{committee.session_label}</p>
                <h2 className="mt-2 text-3xl font-extrabold">{committee.committee_name}</h2>
                <p className="mt-2 text-sm text-white/80">{formatDate(committee.start_date)}{committee.end_date ? ` to ${formatDate(committee.end_date)}` : ' to present'}</p>
              </div>

              <LeadershipGroup title="Core Leadership" members={grouped.core} />
              <LeadershipGroup title="Department Heads" members={grouped.departmentHeads} />
              {grouped.executives.length > 0 && <LeadershipGroup title="Executive Members" members={grouped.executives} />}
              {grouped.other.length > 0 && <LeadershipGroup title="Committee Members" members={grouped.other} />}
            </div>
          )}

          <div className="mt-10">
            <Link href="/about" className="inline-flex rounded-md border border-slate-200 px-4 py-2 text-sm font-extrabold text-uiussc-navy transition hover:border-uiussc-green hover:text-uiussc-green">
              Back to About
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

type PublicMember = Awaited<ReturnType<typeof getActiveCommitteePublic>>['members'][number]

function LeadershipGroup({ title, members }: { title: string; members: PublicMember[] }){
  return (
    <section>
      <h2 className="text-2xl font-extrabold text-uiussc-navy">{title}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <article key={`${member.position_slug}-${member.member_name}`} className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
            <p className="text-sm font-bold text-uiussc-green">{member.position_name}</p>
            <h3 className="mt-2 text-xl font-extrabold text-uiussc-navy">{member.member_name}</h3>
          </article>
        ))}
      </div>
    </section>
  )
}

function formatDate(value: string){
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value))
}
