import AdminHeader from '@/components/admin/AdminHeader'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import FilterBar from '@/components/admin/FilterBar'
import Pagination from '@/components/admin/Pagination'
import { getAuditLogs } from '@/features/admin/queries/getAuditLogs'
import { parseAdminListParams } from '@/features/admin/queries/listParams'

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function AuditLogsPage({ searchParams }: PageProps){
  const params = parseAdminListParams(await searchParams)
  const data = await getAuditLogs(params)

  return (
    <div>
      <AdminHeader title="Audit logs" description="Read-only administrative action timeline with safe metadata summaries." />
      <FilterBar />
      {data.items.length === 0 ? <EmptyAdminState message="No audit logs found." /> : (
        <div className="grid gap-3">
          {data.items.map((item) => (
            <article key={item.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5">
              <h2 className="font-extrabold text-uiussc-charcoal">{item.action}</h2>
              <p className="mt-1 break-all text-sm text-slate-600">{item.entity_type} · {item.entity_id ?? 'no entity'} · {new Date(item.created_at).toLocaleString()}</p>
              <pre className="mt-3 overflow-x-auto rounded-md bg-slate-50 p-3 text-xs text-slate-600">{JSON.stringify(item.metadata, null, 2)}</pre>
            </article>
          ))}
        </div>
      )}
      <Pagination page={params.page} pageSize={params.pageSize} count={data.count} basePath="/admin/audit-logs" />
    </div>
  )
}
