import Container from '@/components/Container'
import PageHeader from '@/components/PageHeader'
import NoticeCard from '@/components/NoticeCard'
import ContentUnavailable from '@/components/states/ContentUnavailable'
import EmptyState from '@/components/states/EmptyState'
import { getPublishedNotices } from '@/features/notices/queries/getPublishedNotices'
import { formatDisplayDate } from '@/lib/date'

export const dynamic = 'force-dynamic'

export default async function Notices(){
  const result = await getPublishedNotices()
  const notices = result.data ?? []
  const pinned = notices.find((notice) => notice.isPinned)
  const remaining = pinned ? notices.filter((notice) => notice.id !== pinned.id) : notices

  return (
    <Container>
      <PageHeader
        title="Notices"
        subtitle="Important club updates, volunteer briefings, deadlines, and logistics announcements from UIUSSC."
      />

      {result.error && <ContentUnavailable title="Notices are temporarily unavailable" description="Please refresh the page or check back soon for UIUSSC announcements." />}
      {!result.error && notices.length === 0 && <EmptyState title="No published notices yet" description="Important UIUSSC updates will appear here once published." />}

      {pinned && (
        <section className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Pinned Notice</p>
              <h2 className="mt-2 text-2xl font-extrabold text-uiussc-navy">{pinned.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-900">{pinned.excerpt}</p>
            </div>
            {pinned.publishedAt && <span className="w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm">{formatDisplayDate(pinned.publishedAt)}</span>}
          </div>
        </section>
      )}

      {remaining.length > 0 && (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {remaining.map((notice) => <NoticeCard key={notice.id} notice={notice} />)}
        </section>
      )}

      {!result.error && notices.length > 0 && <section className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
        <h2 className="text-xl font-bold text-uiussc-navy">More notices will appear here</h2>
        <p className="mt-2 text-sm text-slate-500">The section is ready for future announcements when club operations expand.</p>
      </section>}
    </Container>
  )
}
