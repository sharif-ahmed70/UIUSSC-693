import Link from 'next/link'
import { notFound } from 'next/navigation'
import AccessGrantForm from '@/components/admin/AccessGrantForm'
import AdminActionForm from '@/components/admin/AdminActionForm'
import AdminHeader from '@/components/admin/AdminHeader'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import StatusBadge from '@/components/admin/StatusBadge'
import { grantTemporaryAccessAction, revokeTemporaryAccessAction } from '@/features/access-control/actions'
import { getAccessControlSummary, getAccessUserDetail } from '@/features/access-control/queries'
import type { AccessOverrideSummary } from '@/features/access-control/types'
import { getAdminContext } from '@/features/admin/queries/getAdminContext'
import { formatDepartmentRole, formatPlatformRole, maskEmail } from '@/lib/formatters'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function AccessControlUserPage({ params }: PageProps){
  const { id } = await params
  const [context, user, summary] = await Promise.all([getAdminContext(), getAccessUserDetail(id), getAccessControlSummary()])

  if (!context.permissions.canViewAccessControl || !user) {
    notFound()
  }

  return (
    <div>
      <AdminHeader title="User access detail" description="Review one staff member's official roles, temporary access, restrictions, and effective permission catalogue." />

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-uiussc-charcoal">{user.fullName}</h2>
            <p className="mt-1 text-sm text-slate-600">{maskEmail(user.email)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={user.accountStatus} />
            <StatusBadge status={user.onboardingStatus} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <InfoBlock title="Official positions" values={user.activeClubPositions} empty="No active official position" />
          <InfoBlock title="Platform roles" values={user.activePlatformRoles.map(formatPlatformRole)} empty="No active platform role" />
          <InfoBlock title="Department memberships" values={user.activeDepartmentMemberships.map((membership) => `${membership.departmentName}: ${formatDepartmentRole(membership.role)}`)} empty="No active department membership" />
        </div>
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Create scoped temporary access for this user</h2>
        <div className="mt-4">
          <AccessGrantForm action={grantTemporaryAccessAction} users={[user]} permissions={summary.permissions} departments={summary.departments} selectedUserId={user.id} />
        </div>
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <OverrideList title="Active temporary allows" overrides={user.temporaryAllows} revoke />
        <OverrideList title="Active temporary denies" overrides={user.temporaryDenies} revoke />
        <OverrideList title="Scheduled grants and restrictions" overrides={user.scheduledOverrides} revoke />
        <OverrideList title="Expired, revoked, and cancelled history" overrides={user.historicalOverrides} />
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Effective access summary</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">This catalogue shows available permission definitions by module. Role policies and temporary overrides are still enforced by database helpers and RPCs.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {user.effectiveAccessSummary.map((module) => (
            <article key={module.moduleKey} className="rounded-md border border-slate-200 p-4">
              <h3 className="font-extrabold capitalize text-uiussc-charcoal">{module.moduleKey.replaceAll('_', ' ')}</h3>
              <div className="mt-3 grid gap-2">
                {module.permissions.slice(0, 8).map((permission) => (
                  <p key={permission.permission_key} className="text-sm text-slate-600">
                    <span className="font-bold text-uiussc-charcoal">{permission.name}</span> · {permission.risk_level}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <Link href="/admin/access-control" className="inline-flex rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-uiussc-charcoal transition hover:border-uiussc-orange hover:text-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
        Back to access control
      </Link>
    </div>
  )
}

function InfoBlock({ title, values, empty }: { title: string; values: string[]; empty: string }){
  return (
    <div className="rounded-md bg-uiussc-ivory p-4">
      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{title}</h3>
      <div className="mt-2 grid gap-1 text-sm font-bold text-uiussc-charcoal">
        {values.length === 0 ? <span className="text-slate-500">{empty}</span> : values.map((value) => <span key={value}>{value}</span>)}
      </div>
    </div>
  )
}

function OverrideList({ title, overrides, revoke }: { title: string; overrides: AccessOverrideSummary[]; revoke?: boolean }){
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
      <h2 className="text-xl font-extrabold text-uiussc-charcoal">{title}</h2>
      <div className="mt-4 grid gap-3">
        {overrides.length === 0 ? <EmptyAdminState message="No records in this section." /> : overrides.map((override) => (
          <article key={override.id} className="rounded-md border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-uiussc-charcoal">{override.system_permissions?.name ?? override.permission_id}</h3>
                <p className="mt-1 font-mono text-xs text-slate-500">{override.system_permissions?.permission_key}</p>
                <p className="mt-2 text-sm text-slate-600">{override.effect} · {override.scope_type} · expires {override.expires_at ?? 'manually'}</p>
                <p className="mt-1 text-sm text-slate-600">Reason: {override.reason}</p>
              </div>
              <StatusBadge status={override.status} />
            </div>
            {revoke && ['active', 'scheduled'].includes(override.status) && (
              <div className="mt-4">
                <AdminActionForm action={revokeTemporaryAccessAction} id={override.id} submitLabel="Revoke access" danger fields={
                  <label className="grid gap-2 text-sm font-bold text-uiussc-charcoal">
                    Revocation reason <span className="text-red-700">*</span>
                    <textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm font-normal" required />
                  </label>
                } />
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
