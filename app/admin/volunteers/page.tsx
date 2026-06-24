import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import FilterBar from '@/components/admin/FilterBar'
import Pagination from '@/components/admin/Pagination'
import StatusBadge from '@/components/admin/StatusBadge'
import { getVolunteers } from '@/features/admin/queries/getVolunteers'
import { parseAdminListParams } from '@/features/admin/queries/listParams'

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function VolunteersPage({ searchParams }: PageProps){
  const params = parseAdminListParams(await searchParams)
  const data = await getVolunteers(params)

  return (
    <div>
      <AdminHeader title="Volunteer profiles" description="Review onboarding profiles and manage verified staff access." />
      <FilterBar statuses={['pending', 'approved', 'rejected', 'suspended', 'archived']} />
      {data.items.length === 0 ? <EmptyAdminState /> : (
        <div className="grid gap-3">
          {data.items.map((item) => (
            <Link key={item.id} href={`/admin/volunteers/${item.id}`} className="rounded-md border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5 transition hover:border-uiussc-orange">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-extrabold text-uiussc-charcoal">{item.full_name}</h2>
                  <p className="mt-1 break-all text-sm text-slate-600">{item.email} · {item.student_id ?? 'No student ID'}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.academic_department ?? 'No academic department'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={item.account_status} />
                  <StatusBadge status={item.onboarding_status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <Pagination page={params.page} pageSize={params.pageSize} count={data.count} basePath="/admin/volunteers" />
    </div>
  )
}
