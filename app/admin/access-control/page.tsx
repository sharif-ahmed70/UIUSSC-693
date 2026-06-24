import Link from 'next/link'
import { notFound } from 'next/navigation'
import AccessGrantForm from '@/components/admin/AccessGrantForm'
import AdminActionForm from '@/components/admin/AdminActionForm'
import AdminHeader from '@/components/admin/AdminHeader'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import StatusBadge from '@/components/admin/StatusBadge'
import { grantTemporaryAccessAction, revokeTemporaryAccessAction } from '@/features/access-control/actions'
import { getAccessControlSummary } from '@/features/access-control/queries'
import { getAdminContext } from '@/features/admin/queries/getAdminContext'
import { formatDepartmentRole, formatPlatformRole, maskEmail } from '@/lib/formatters'

export default async function AccessControlPage(){
  const [context, data] = await Promise.all([getAdminContext(), getAccessControlSummary()])

  if (!context.permissions.canViewAccessControl) {
    notFound()
  }

  const approvedUsers = data.users.filter((user) => user.accountStatus === 'approved' && user.onboardingStatus === 'approved')

  return (
    <div>
      <AdminHeader title="Access control" description="Permission catalogue, temporary access grants, restrictions, and expiry-aware governance for UIUSSC staff accounts." />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <h2 className="font-extrabold">Temporary access is controlled by RPC</h2>
        <p className="mt-2 text-sm leading-6">Deny overrides take precedence over role permissions. Expired grants stop working by timestamp even before any cleanup job updates their status.</p>
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Grant or restrict temporary access</h2>
        <div className="mt-4">
          <AccessGrantForm action={grantTemporaryAccessAction} users={approvedUsers} permissions={data.permissions} departments={data.departments} events={data.events} />
        </div>
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">User directory</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Showing a limited set of non-archived, non-rejected profiles. Use the selector search above to narrow by name, masked email, club position, platform role, department, or status.</p>
        <div className="mt-4 grid gap-3">
          {data.users.length === 0 ? <EmptyAdminState message="No accessible staff profiles found." /> : data.users.map((user) => (
            <article key={user.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-uiussc-charcoal">{user.fullName}</h3>
                  <p className="mt-1 text-sm text-slate-600">{maskEmail(user.email)} · {user.accountStatus}/{user.onboardingStatus}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {[...user.activeClubPositions, ...user.activePlatformRoles.map(formatPlatformRole), ...user.activeDepartmentMemberships.map((membership) => `${membership.departmentName}: ${formatDepartmentRole(membership.role)}`)].join(' · ') || 'No active internal role'}
                  </p>
                </div>
                <Link href={`/admin/access-control/users/${user.id}`} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-extrabold text-uiussc-charcoal transition hover:border-uiussc-orange hover:text-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
                  View access
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Permission catalogue</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.permissions.map((permission) => (
            <article key={permission.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-uiussc-charcoal">{permission.name}</h3>
                  <p className="mt-1 font-mono text-xs text-slate-500">{permission.permission_key}</p>
                </div>
                <StatusBadge status={permission.risk_level} />
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Supports {[permission.supports_global_scope ? 'global' : null, permission.supports_department_scope ? 'department' : null, permission.supports_event_scope ? 'event' : null, permission.supports_record_scope ? 'record later' : null].filter(Boolean).join(', ') || 'no selectable scope'} scope.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Temporary grants and restrictions</h2>
        <div className="mt-4 grid gap-3">
          {data.overrides.length === 0 ? <EmptyAdminState message="No temporary access grants or restrictions have been recorded." /> : data.overrides.map((override) => (
            <article key={override.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-uiussc-charcoal">{override.system_permissions?.permission_key ?? override.permission_id}</h3>
                  <p className="mt-1 text-sm text-slate-600">{override.volunteer_profiles?.full_name ?? 'Staff member'} {maskEmail(override.volunteer_profiles?.email) ? `(${maskEmail(override.volunteer_profiles?.email)})` : ''}</p>
                  <p className="mt-1 text-sm text-slate-600">{override.effect} · {override.scope_type} · expires {override.expires_at ?? 'manually'}</p>
                </div>
                <StatusBadge status={override.status} />
              </div>
              {override.status === 'active' || override.status === 'scheduled' ? (
                <div className="mt-4 max-w-md">
                  <AdminActionForm action={revokeTemporaryAccessAction} id={override.id} submitLabel="Revoke access" danger fields={
                    <label className="grid gap-2 text-sm font-bold text-uiussc-charcoal">
                      Revocation reason <span className="text-red-700">*</span>
                      <textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm font-normal" required />
                    </label>
                  } />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
