import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
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
        <Metric label="Completed cases" value={report.fulfilledRequests} />
        <Metric label="Fulfillment rate" value={`${report.fulfillmentRate}%`} />
        <Metric label="Active donors" value={report.activeDonors} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ReportPanel title="Most Requested Blood Groups">
          {Object.entries(report.demand).map(([group, units]) => (
            <Bar key={group} label={group} value={units} max={Math.max(...Object.values(report.demand), 1)} suffix="unit(s)" />
          ))}
          {Object.keys(report.demand).length === 0 && <p className="text-sm text-slate-600">No demand data available yet.</p>}
        </ReportPanel>

        <ReportPanel title="Monthly Donation Trend">
          {Object.entries(report.months).map(([month, units]) => (
            <Bar key={month} label={month} value={units} max={Math.max(...Object.values(report.months), 1)} suffix="unit(s)" />
          ))}
          {Object.keys(report.months).length === 0 && <p className="text-sm text-slate-600">No donation trend available yet.</p>}
        </ReportPanel>
      </section>

      <ReportPanel title="Department Activity">
        <div className="grid gap-3 md:grid-cols-2">
          <Metric label="Active matches" value={report.activeMatches} />
          <Metric label="Donation checks pending" value={report.pendingVerification} />
        </div>
      </ReportPanel>

      <section className="rounded-md border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
        <h2 className="font-extrabold">Security boundary</h2>
        <p className="mt-2 text-sm leading-6">This report intentionally avoids donor/requester phone, email, and medical details. Operational contact access remains limited to authorized match workflow.</p>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number | string }){
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
      <p className="text-3xl font-extrabold text-uiussc-navy">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-600">{label}</p>
    </div>
  )
}

function ReportPanel({ title, children }: { title: string; children: ReactNode }){
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
      <h2 className="text-xl font-extrabold text-uiussc-charcoal">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  )
}

function Bar({ label, value, max, suffix }: { label: string; value: number; max: number; suffix: string }){
  const width = Math.max(8, Math.round((value / max) * 100))

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700">
        <span>{label}</span>
        <span>{value} {suffix}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-uiussc-green" style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}
