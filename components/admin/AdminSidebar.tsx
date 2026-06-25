import Link from 'next/link'
import { signOutAction } from '@/features/auth/actions/signOut'
import AdminNavigationLinks from '@/components/admin/AdminNavigationLinks'
import type { AdminContext } from '@/features/admin/types'
import { formatPlatformRole, maskEmail } from '@/lib/formatters'

type AdminSidebarProps = {
  context: AdminContext
}

export default function AdminSidebar({ context }: AdminSidebarProps){
  return (
    <aside className="rounded-md border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5 lg:sticky lg:top-28 lg:self-start">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-orange">Administration</p>
      <h2 className="mt-2 text-lg font-extrabold text-uiussc-charcoal">{context.staff.profile?.fullName}</h2>
      {maskEmail(context.staff.email) && <p className="mt-1 break-all text-sm text-slate-500">{maskEmail(context.staff.email)}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {context.staff.platformRoles.map((role) => (
          <span key={role} className="rounded-md bg-uiussc-ivory px-2 py-1 text-xs font-bold text-uiussc-charcoal">{formatPlatformRole(role)}</span>
        ))}
      </div>

      <nav className="mt-5 grid gap-1" aria-label="Admin navigation">
        <AdminNavigationLinks permissions={context.permissions} />
      </nav>

      <div className="mt-5 grid gap-2">
        <Link href="/staff" className="rounded-md border border-slate-200 px-3 py-2 text-center text-sm font-bold text-uiussc-charcoal transition hover:border-uiussc-orange hover:text-uiussc-orange">Staff Dashboard</Link>
        <Link href="/" className="rounded-md border border-slate-200 px-3 py-2 text-center text-sm font-bold text-uiussc-charcoal transition hover:border-uiussc-orange hover:text-uiussc-orange">Public Site</Link>
        <form action={signOutAction}>
          <button type="submit" className="min-h-10 w-full rounded-md bg-uiussc-orange px-3 py-2 text-sm font-extrabold text-white transition hover:bg-[#e85d00]">
            Log out
          </button>
        </form>
      </div>
    </aside>
  )
}
