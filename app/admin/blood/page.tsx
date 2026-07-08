import { notFound } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import { getBloodAdminReport } from '@/features/blood/queries'
import { getAdminContext } from '@/features/admin/queries/getAdminContext'

export default async function AdminBloodPage(){
  const [context, report] = await Promise.all([getAdminContext(), getBloodAdminReport()])

  if (!context.permissions.canViewBloodAdmin) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <AdminHeader title="Blood Support reports" description="Super Admin reporting for Blood Support operations. Contact data is intentionally excluded." />

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Total requests" value={report.totalRequests} />
        <Metric label="Fulfilled requests" value={report.fulfilledRequests} />
        <Metric label="Active matches" value={report.activeMatches} />
        <Metric label="Pending verification" value={report.pendingVerification} />
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Blood group demand</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {Object.entries(report.demand).map(([group, units]) => (
            <div key={group} className="rounded-md bg-slate-50 p-4">
              <p className="text-2xl font-extrabold text-uiussc-navy">{group}</p>
              <p className="mt-1 text-sm font-bold text-slate-600">{units} requested unit(s)</p>
            </div>
          ))}
          {Object.keys(report.demand).length === 0 && <p className="text-sm text-slate-600">No demand data available yet.</p>}
        </div>
      </section>

      <section className="rounded-md border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
        <h2 className="font-extrabold">Security boundary</h2>
        <p className="mt-2 text-sm leading-6">This report intentionally avoids donor/requester phone, email, and medical details. Operational contact access remains limited to authorized match workflow.</p>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }){
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
      <p className="text-3xl font-extrabold text-uiussc-navy">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-600">{label}</p>
    </div>
  )
}
