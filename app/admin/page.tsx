import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminStatCard from '@/components/admin/AdminStatCard'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import { getAdminContext } from '@/features/admin/queries/getAdminContext'
import { getAdminDashboardData } from '@/features/admin/queries/getAdminDashboardData'

export default async function AdminDashboardPage(){
  const [context, data] = await Promise.all([getAdminContext(), getAdminDashboardData()])

  return (
    <div>
      <AdminHeader title="Administration dashboard" description="Review queues, volunteer verification, department access, and audit visibility for authorized UIUSSC administrators." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard label="Pending applications" value={data.pendingApplications} />
        <AdminStatCard label="Profiles awaiting review" value={data.awaitingProfiles} />
        <AdminStatCard label="Department requests" value={data.departmentRequests} />
        <AdminStatCard label="Approved volunteers" value={data.approvedVolunteers} />
        <AdminStatCard label="Active departments" value={data.activeDepartments} />
      </div>

      <section className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <h2 className="font-extrabold">Invitation workflow not configured</h2>
        <p className="mt-2 text-sm leading-6">Approved membership applications can be reviewed, but account invitation sending is intentionally deferred.</p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {context.permissions.canReviewMembershipApplications && <QuickLink href="/admin/membership-applications" label="Review membership applications" />}
        {context.permissions.canManageVolunteers && <QuickLink href="/admin/volunteers" label="Review volunteer profiles" />}
        {context.permissions.canManageVolunteers && <QuickLink href="/admin/department-memberships" label="Manage department requests" />}
        {context.permissions.canManageDepartments && <QuickLink href="/admin/departments" label="Manage departments" />}
      </section>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Recent administrative actions</h2>
        <div className="mt-4 grid gap-3">
          {data.recentAuditLogs.length === 0 ? <EmptyAdminState message="No administrative actions have been recorded yet." /> : data.recentAuditLogs.map((item) => (
            <div key={item.id} className="rounded-md border border-slate-200 px-4 py-3 text-sm text-slate-700">
              <span className="font-bold">{item.action}</span> on {item.entity_type}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function QuickLink({ href, label }: { href: string; label: string }){
  return (
    <Link href={href} className="rounded-md border border-slate-200 bg-white p-5 font-extrabold text-uiussc-charcoal shadow-lg shadow-slate-900/5 transition hover:border-uiussc-orange hover:text-uiussc-orange">
      {label}
    </Link>
  )
}
