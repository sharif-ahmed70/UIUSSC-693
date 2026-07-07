import { notFound } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import StatusBadge from '@/components/admin/StatusBadge'
import { getOfficialPermissionMatrix } from '@/features/access-control/queries'
import { getAdminContext } from '@/features/admin/queries/getAdminContext'
import { formatPlatformRole } from '@/lib/formatters'

const corePositionLabels: Record<string, string> = {
  president: 'President',
  'vice-president': 'Vice President',
  'assistant-vice-president': 'Assistant Vice President',
  'general-secretary': 'General Secretary',
  treasurer: 'Treasurer',
}

const departmentRoleLabels: Record<string, string> = {
  department_head: 'Department Head',
  deputy_head: 'Deputy Head',
  executive: 'Executive',
}

function formatScope(scope: string){
  return scope.replace(/_/g, ' ')
}

export default async function PermissionMatrixPage(){
  const [context, matrix] = await Promise.all([getAdminContext(), getOfficialPermissionMatrix()])

  if (!context.permissions.canViewAccessControl) {
    notFound()
  }

  return (
    <div>
      <AdminHeader
        title="Official permission matrix"
        description="Read-only view of the UIUSSC role permission matrix, access boundaries, and approval-sensitive operations."
      />

      <section className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
        <h2 className="font-extrabold">Access boundary model</h2>
        <p className="mt-2 text-sm leading-6">
          Super Admin remains the emergency full-access role. Core Panel roles receive club-wide operational access according to the official hierarchy. Department leadership is limited to its own department, and executives are limited to assigned event or task work.
        </p>
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Resource permissions</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {matrix.permissionsByModule.map((module) => (
            <article key={module.moduleKey} className="rounded-md border border-slate-200 p-4">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-uiussc-orange">{module.moduleKey}</h3>
              <div className="mt-3 grid gap-3">
                {module.permissions.map((permission) => (
                  <div key={permission.id} className="rounded-md bg-slate-50 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-extrabold text-uiussc-charcoal">{permission.name}</p>
                        <p className="mt-1 font-mono text-xs text-slate-500">{permission.permission_key}</p>
                      </div>
                      <StatusBadge status={permission.risk_level} />
                    </div>
                    {permission.description && <p className="mt-2 text-sm leading-6 text-slate-600">{permission.description}</p>}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Core Panel position policies</h2>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {Object.entries(corePositionLabels).map(([slug, label]) => {
            const policies = matrix.positionPolicies[slug] ?? []
            return (
              <article key={slug} className="rounded-md border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-extrabold text-uiussc-charcoal">{label}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{policies.length} permissions</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {policies.map((policy) => (
                    <span key={policy.id} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                      {policy.permissionKey} · {formatScope(policy.scopeRule)}{policy.requiresApproval ? ' · approval' : ''}
                    </span>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <h2 className="text-xl font-extrabold text-uiussc-charcoal">Department role boundaries</h2>
          <div className="mt-4 grid gap-3">
            {Object.entries(departmentRoleLabels).map(([role, label]) => (
              <article key={role} className="rounded-md border border-slate-200 p-4">
                <h3 className="font-extrabold text-uiussc-charcoal">{label}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(matrix.departmentRolePolicies[role] ?? []).map((policy) => (
                    <span key={policy.id} className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                      {policy.permissionKey} · {formatScope(policy.scopeRule)}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <h2 className="text-xl font-extrabold text-uiussc-charcoal">Platform role policies</h2>
          <div className="mt-4 grid gap-3">
            {Object.entries(matrix.platformRolePolicies).map(([role, policies]) => (
              <article key={role} className="rounded-md border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-extrabold text-uiussc-charcoal">{formatPlatformRole(role)}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{policies.length} policies</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Platform roles are website-access roles and remain separate from official club positions.
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
