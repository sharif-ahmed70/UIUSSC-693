import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getDepartmentDestination } from '@/features/departments/getDepartmentDestination'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import { resolveStaffDestination } from '@/features/staff/routing/resolveStaffDestination'

export default async function StaffDashboardPage(){
  const access = await getStaffAccessContext()
  const destination = resolveStaffDestination(access, '/staff')

  if (destination !== '/staff') {
    redirect(destination)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-md bg-uiussc-charcoal p-6 text-white shadow-xl shadow-slate-900/10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-orange">Staff Dashboard</p>
        <h1 className="mt-3 text-3xl font-extrabold">Welcome, {access.profile?.fullName}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          Your approved UIUSSC department access is shown below. Operational modules will arrive in later phases.
        </p>
      </section>

      {(access.platformRoles.includes('club_admin') || access.platformRoles.includes('super_admin')) && (
        <section className="rounded-md border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <h2 className="font-extrabold">Administration access available</h2>
          <p className="mt-2 text-sm leading-6">The admin approval system is intentionally deferred. This panel only confirms platform role detection.</p>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-orange">Club Leadership</p>
          <h2 className="mt-2 text-xl font-extrabold text-uiussc-charcoal">
            {access.primaryClubPosition?.position.name ?? 'No official position assigned'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Core Panel: {access.primaryClubPosition?.position.isCorePanel ? 'Yes' : 'No'}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Term: {access.primaryClubPosition ? `${access.primaryClubPosition.termStart}${access.primaryClubPosition.termEnd ? ` to ${access.primaryClubPosition.termEnd}` : ' to present'}` : 'Not assigned'}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-orange">Platform Access</p>
          <h2 className="mt-2 text-xl font-extrabold text-uiussc-charcoal">
            {access.platformRoles.length > 0 ? access.platformRoles.map((role) => role.replace('_', ' ')).join(', ') : 'No platform role'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">Website permissions are managed separately from club positions.</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-orange">Departments</p>
          <h2 className="mt-2 text-xl font-extrabold text-uiussc-charcoal">
            {access.approvedMemberships.length > 0 ? `${access.approvedMemberships.length} assigned` : 'No operational department assigned'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">Core Panel executives do not require a fake department assignment.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {access.approvedMemberships.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-white p-5 text-sm font-bold text-slate-600 shadow-lg shadow-slate-900/5">
            No operational department assigned.
          </div>
        ) : access.approvedMemberships.map((membership) => (
          <Link key={membership.id} href={getDepartmentDestination(membership.department.slug)} className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5 transition hover:-translate-y-0.5 hover:border-uiussc-orange hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-orange">{membership.role.replace('_', ' ')}</p>
            <h2 className="mt-2 text-xl font-extrabold text-uiussc-charcoal">{membership.department.name}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{membership.department.shortDescription ?? 'Department workspace setup is in progress.'}</p>
            {membership.isPrimary && <span className="mt-4 inline-flex rounded-md bg-uiussc-ivory px-3 py-1 text-xs font-bold text-uiussc-charcoal">Primary department</span>}
          </Link>
        ))}
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Profile summary</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="font-bold text-slate-500">Email</dt><dd className="mt-1 text-slate-800">{access.profile?.email}</dd></div>
          <div><dt className="font-bold text-slate-500">Student ID</dt><dd className="mt-1 text-slate-800">{access.profile?.studentId ?? 'Not provided'}</dd></div>
          <div><dt className="font-bold text-slate-500">Account status</dt><dd className="mt-1 text-slate-800">{access.profile?.accountStatus}</dd></div>
          <div><dt className="font-bold text-slate-500">Onboarding</dt><dd className="mt-1 text-slate-800">{access.profile?.onboardingStatus}</dd></div>
        </dl>
      </section>
    </div>
  )
}
