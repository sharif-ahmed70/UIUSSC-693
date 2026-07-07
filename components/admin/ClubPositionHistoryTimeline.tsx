import Link from 'next/link'
import StatusBadge from '@/components/admin/StatusBadge'
import type { ClubPositionHistoryItem } from '@/features/admin/queries/getClubPositionHistory'
import { formatDisplayDate } from '@/lib/date'

type ClubPositionHistoryTimelineProps = {
  profileId: string
  currentPosition: ClubPositionHistoryItem | null
  history: ClubPositionHistoryItem[]
  compact?: boolean
}

export default function ClubPositionHistoryTimeline({ profileId, currentPosition, history, compact }: ClubPositionHistoryTimelineProps){
  const previousPositions = history.filter((item) => item.status !== 'active')
  const timelineItems = compact ? history.slice(0, 4) : history

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-uiussc-charcoal">Position History</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Official club position lifecycle, including assignments, endings, transfers, and revocations.</p>
        </div>
        {compact && (
          <Link href={`/admin/volunteers/${profileId}/history`} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-extrabold text-slate-700 transition hover:border-uiussc-orange hover:text-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/15">
            View full history
          </Link>
        )}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[18rem_1fr]">
        <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">Current position</p>
          {currentPosition ? (
            <div className="mt-3">
              <h3 className="text-lg font-extrabold text-emerald-950">{currentPosition.club_positions?.name ?? 'Position'}</h3>
              <p className="mt-1 text-sm text-emerald-900">Assigned {formatDate(currentPosition.term_start)}</p>
              <p className="mt-1 text-sm text-emerald-900">Assigned by {currentPosition.assignedByName ?? 'Admin'}</p>
              <div className="mt-3"><StatusBadge status={currentPosition.status} /></div>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-emerald-900">No active official position.</p>
          )}
        </div>

        <div className="min-w-0">
          {history.length === 0 ? (
            <p className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-500">No position history found.</p>
          ) : (
            <ol className="relative grid gap-4 border-l border-slate-200 pl-5">
              {timelineItems.map((item) => (
                <li key={item.id} className="relative rounded-md border border-slate-200 p-4">
                  <span className="absolute -left-[1.72rem] top-5 size-3 rounded-full bg-uiussc-orange ring-4 ring-white" aria-hidden="true" />
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-uiussc-orange">{formatDate(item.term_start)}</p>
                      <h3 className="mt-1 break-words text-lg font-extrabold text-uiussc-charcoal">{item.club_positions?.name ?? 'Position'}</h3>
                      <p className="mt-1 text-sm text-slate-600">{item.is_primary ? 'Primary' : 'Secondary'}{item.club_positions?.is_core_panel ? ' Core Panel' : ''}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                    <Meta label="Assigned by" value={item.assignedByName ?? 'Admin'} />
                    <Meta label="Assigned at" value={formatDateTime(item.assigned_at)} />
                    {item.term_end && <Meta label="End date" value={formatDate(item.term_end)} />}
                    {item.endedByName && <Meta label="Ended by" value={item.endedByName} />}
                    {item.revokedByName && <Meta label="Revoked by" value={item.revokedByName} />}
                    {item.reason && <Meta label="Reason" value={item.reason} />}
                  </dl>
                </li>
              ))}
            </ol>
          )}
          {compact && previousPositions.length > 3 && <p className="mt-3 text-sm text-slate-500">{previousPositions.length - 3} older record(s) available in full history.</p>}
        </div>
      </div>
    </section>
  )
}

function Meta({ label, value }: { label: string; value: string }){
  return <div><dt className="font-bold text-slate-500">{label}</dt><dd className="mt-1 break-words text-slate-800">{value}</dd></div>
}

function formatDate(date: string){
  return formatDisplayDate(`${date}T00:00:00+06:00`)
}

function formatDateTime(date: string){
  return formatDisplayDate(date)
}
