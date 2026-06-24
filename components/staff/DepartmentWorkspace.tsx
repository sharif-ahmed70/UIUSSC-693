import Link from 'next/link'
import { departmentFutureCapabilities } from '@/features/departments/routeMap'
import type { KnownDepartmentSlug } from '@/features/departments/types'
import type { StaffMembership } from '@/features/staff/types'
import { formatDepartmentRole } from '@/lib/formatters'

type DepartmentWorkspaceProps = {
  slug: KnownDepartmentSlug
  departmentName: string
  membership: StaffMembership | null
}

export default function DepartmentWorkspace({ slug, departmentName, membership }: DepartmentWorkspaceProps){
  return (
    <div className="space-y-6">
      <div className="rounded-md bg-uiussc-charcoal p-6 text-white shadow-xl shadow-slate-900/10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-orange">Department Workspace</p>
        <h1 className="mt-3 text-3xl font-extrabold">{departmentName}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          {departmentName} workspace access is active. Event-task management and operational tools will be added in CM-5.
        </p>
        <p className="mt-4 inline-flex rounded-md bg-white/10 px-3 py-2 text-sm font-bold text-white">
          Current role: {membership ? formatDepartmentRole(membership.role) : 'Platform Administrator'}
        </p>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Future capabilities</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {departmentFutureCapabilities[slug].map((capability) => (
            <div key={capability} className="rounded-md border border-slate-200 bg-uiussc-ivory px-4 py-3 text-sm font-bold text-slate-700">
              {capability}
            </div>
          ))}
        </div>
      </div>

      <Link href="/staff" className="inline-flex rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-uiussc-charcoal transition hover:border-uiussc-orange hover:text-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
        Back to staff dashboard
      </Link>
    </div>
  )
}
