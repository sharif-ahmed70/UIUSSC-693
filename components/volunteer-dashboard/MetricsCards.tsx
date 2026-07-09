'use client'

import type { VolunteerMetrics } from '@/features/volunteer-dashboard/types'

function scrollToMember(memberId: string | null){
  if(!memberId) return
  document.getElementById(`member-${memberId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

export default function MetricsCards({ metrics }: { metrics: VolunteerMetrics }){
  const cards = [
    ['Total Members', metrics.totalMembers],
    ['Present', metrics.presentCount],
    ['Absent', metrics.absentCount],
    ['Unmarked', metrics.unmarkedCount],
  ] as const

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, value]) => (
        <article key={label} className="rounded-md border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5">
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-uiussc-charcoal">{value}</p>
        </article>
      ))}
      <button type="button" onClick={() => scrollToMember(metrics.mostActiveMemberId)} className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-left transition hover:border-emerald-400 xl:col-span-2">
        <p className="text-sm font-bold text-emerald-800">Most Active Member</p>
        <p className="mt-2 font-extrabold text-emerald-950">{metrics.mostActiveMember ?? 'Not enough records yet'}</p>
      </button>
      <button type="button" onClick={() => scrollToMember(metrics.mostIrregularMemberId)} className="rounded-md border border-orange-200 bg-orange-50 p-4 text-left transition hover:border-orange-400 xl:col-span-2">
        <p className="text-sm font-bold text-orange-800">Most Irregular Member</p>
        <p className="mt-2 font-extrabold text-orange-950">{metrics.mostIrregularMember ?? 'Not enough records yet'}</p>
      </button>
    </section>
  )
}
