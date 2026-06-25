import Link from 'next/link'
import type { ReactNode } from 'react'
import { signOutAction } from '@/features/auth/actions/signOut'
import { getDepartmentDestination } from '@/features/departments/getDepartmentDestination'
import type { StaffAccessContext } from '@/features/staff/types'
import DepartmentSwitcher from './DepartmentSwitcher'

type StaffShellProps = {
  access: StaffAccessContext
  children: ReactNode
}

export default function StaffShell({ access, children }: StaffShellProps){
  const profile = access.profile

  return (
    <div className="bg-uiussc-ivory">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[17rem_1fr]">
        <aside className="rounded-md border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5 lg:sticky lg:top-28 lg:self-start">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-orange">Staff Portal</p>
            <h2 className="mt-2 text-lg font-extrabold text-uiussc-charcoal">{profile?.fullName ?? 'UIUSSC Volunteer'}</h2>
            <p className="mt-1 text-sm text-slate-500">{access.email}</p>
          </div>

          <nav className="mt-4 grid gap-1" aria-label="Staff navigation">
            <Link className="rounded-md px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-uiussc-ivory hover:text-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" href="/staff">Dashboard</Link>
            {(access.platformRoles.includes('super_admin') || access.platformRoles.includes('club_admin') || access.approvedMemberships.length > 0) && (
              <Link className="rounded-md px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-uiussc-ivory hover:text-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" href="/staff/assigned-events">
                Assigned Events
              </Link>
            )}
            {(access.platformRoles.includes('super_admin') || access.platformRoles.includes('club_admin') || access.clubPositions.length > 0 || access.approvedMemberships.length > 0) && (
              <Link className="rounded-md px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-uiussc-ivory hover:text-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" href="/staff/tasks">
                Tasks
              </Link>
            )}
            {(access.platformRoles.includes('super_admin') || access.platformRoles.includes('club_admin') || access.clubPositions.length > 0 || access.approvedMemberships.length > 0) && (
              <Link className="rounded-md px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-uiussc-ivory hover:text-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" href="/staff/progress">
                Progress
              </Link>
            )}
            {access.approvedMemberships.map((membership) => (
              <Link key={membership.id} className="rounded-md px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-uiussc-ivory hover:text-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" href={getDepartmentDestination(membership.department.slug)}>
                {membership.department.name}
              </Link>
            ))}
          </nav>

          <div className="mt-5">
            <DepartmentSwitcher memberships={access.approvedMemberships} />
          </div>

          <form action={signOutAction} className="mt-5">
            <button type="submit" className="min-h-11 w-full rounded-md border border-slate-200 px-4 py-2 text-sm font-extrabold text-uiussc-charcoal transition hover:border-uiussc-orange hover:text-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
              Log out
            </button>
          </form>
        </aside>

        <section className="min-w-0">
          {children}
        </section>
      </div>
    </div>
  )
}
