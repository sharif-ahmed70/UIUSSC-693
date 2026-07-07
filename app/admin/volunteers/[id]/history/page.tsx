import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import ClubPositionHistoryTimeline from '@/components/admin/ClubPositionHistoryTimeline'
import { getClubPositionHistory } from '@/features/admin/queries/getClubPositionHistory'

type PageProps = { params: Promise<{ id: string }> }

export default async function VolunteerPositionHistoryPage({ params }: PageProps){
  const { id } = await params
  const data = await getClubPositionHistory(id)
  if (!data.profile) notFound()

  return (
    <div className="space-y-6">
      <AdminHeader title={`${data.profile.full_name} Position History`} description="Complete official club position lifecycle for this volunteer." />
      <Link href={`/admin/volunteers/${id}`} className="inline-flex min-h-10 items-center rounded-md border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-700 transition hover:border-uiussc-orange hover:text-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/15">
        Back to volunteer
      </Link>
      {data.error && <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800" role="alert">Position history is temporarily unavailable.</div>}
      <ClubPositionHistoryTimeline profileId={id} currentPosition={data.currentPosition} history={data.history} />
    </div>
  )
}
