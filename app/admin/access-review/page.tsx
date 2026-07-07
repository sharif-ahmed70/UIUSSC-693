import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import StatusBadge from '@/components/admin/StatusBadge'
import { getAccessReviewUsers } from '@/features/access-control/queries'
import { getAdminContext } from '@/features/admin/queries/getAdminContext'
import { formatDepartmentRole, formatPlatformRole, maskEmail } from '@/lib/formatters'

function uniquePermissionCount(sources: Awaited<ReturnType<typeof getAccessReviewUsers>>[number]['permissionSummary']){
  return new Set(sources.flatMap((source) => source.permissions.map((permission) => permission.permissionKey))).size
}

export default async function AccessReviewPage(){
  const [context, users] = await Promise.all([getAdminContext(), getAccessReviewUsers()])

  if (!context.permissions.canViewAccessControl) {
    notFound()
  }

  return (
    <div>
      <AdminHeader
        title="Access review"
        description="Review how each approved staff member receives access through platform roles, official club positions, and department assignments."
      />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-5 text-amber-950">
        <h2 className="font-extrabold">Review guidance</h2>
        <p className="mt-2 text-sm leading-6">
          This page is read-only. Use it to spot over-broad access, missing department boundaries, and temporary overrides that should be reviewed in Access Control.
        </p>
      </section>

      <section className="grid gap-4">
        {users.length === 0 ? <EmptyAdminState message="No staff or volunteer accounts are currently visible for access review." /> : users.map((user) => (
          <article key={user.id} className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-uiussc-charcoal">{user.fullName}</h2>
                <p className="mt-1 text-sm text-slate-600">{maskEmail(user.email)} · {user.accountStatus}/{user.onboardingStatus}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {user.activePlatformRoles.map((role) => (
                    <span key={role} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
                      {formatPlatformRole(role)}
                    </span>
                  ))}
                  {user.activeClubPositions.map((position) => (
                    <span key={position} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                      {position}
                    </span>
                  ))}
                  {user.activeDepartmentMemberships.map((membership) => (
                    <span key={`${membership.departmentSlug}-${membership.role}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {membership.departmentName}: {formatDepartmentRole(membership.role)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-uiussc-charcoal">{uniquePermissionCount(user.permissionSummary)}</p>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">unique permissions</p>
                <Link href={`/admin/access-control/users/${user.id}`} className="mt-3 inline-flex rounded-md border border-slate-200 px-3 py-2 text-sm font-extrabold text-uiussc-charcoal transition hover:border-uiussc-orange hover:text-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
                  Review overrides
                </Link>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {user.permissionSummary.length === 0 ? (
                <div className="rounded-md border border-slate-200 p-4 text-sm text-slate-600 lg:col-span-3">
                  No active internal permission policy is attached to this account.
                </div>
              ) : user.permissionSummary.map((source) => (
                <div key={source.source} className="rounded-md border border-slate-200 p-4">
                  <h3 className="font-extrabold text-uiussc-charcoal">{source.source}</h3>
                  <div className="mt-3 grid gap-2">
                    {source.permissions.slice(0, 10).map((permission) => (
                      <div key={`${source.source}-${permission.id}`} className="rounded-md bg-slate-50 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-mono text-xs font-bold text-slate-700">{permission.permissionKey}</p>
                          <StatusBadge status={permission.riskLevel} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {permission.scopeRule.replace(/_/g, ' ')}{permission.requiresApproval ? ` · ${permission.approvalPolicyKey ?? 'approval required'}` : ''}
                        </p>
                      </div>
                    ))}
                    {source.permissions.length > 10 && (
                      <p className="text-xs font-bold text-slate-500">+{source.permissions.length - 10} more policies</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
