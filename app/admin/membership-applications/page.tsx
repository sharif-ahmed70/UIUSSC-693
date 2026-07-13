import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import FilterBar from '@/components/admin/FilterBar'
import Pagination from '@/components/admin/Pagination'
import StatusBadge from '@/components/admin/StatusBadge'
import { getMembershipApplications } from '@/features/admin/queries/getMembershipApplications'
import { parseAdminListParams } from '@/features/admin/queries/listParams'

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function MembershipApplicationsPage({ searchParams }: PageProps){
  const params = parseAdminListParams(await searchParams)
  const data = await getMembershipApplications(params)

  return (
    <div>
      <AdminHeader title="Membership applications" description="Review public membership applications. Approval does not create an Auth account or send an invitation yet." />
      <FilterBar statuses={['pending', 'approved', 'rejected', 'waitlisted', 'withdrawn']} />
      {data.items.length === 0 ? <EmptyAdminState /> : (
        <div className="grid gap-3">
          {data.items.map((item) => (
            <Link key={item.id} href={`/admin/membership-applications/${item.id}`} className="rounded-md border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5 transition hover:border-uiussc-orange">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-extrabold text-uiussc-charcoal">{item.full_name}</h2>
                  <p className="mt-1 break-all text-sm text-slate-600">{item.email} · {item.student_id}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.department} → {item.interested_department}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
      <Pagination page={params.page} pageSize={params.pageSize} count={data.count} basePath="/admin/membership-applications" />
    </div>
  )
}
