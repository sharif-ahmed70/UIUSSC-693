'use client'

import Link from 'next/link'
import { useState } from 'react'
import { signOutAction } from '@/features/auth/actions/signOut'
import AdminNavigationLinks from '@/components/admin/AdminNavigationLinks'
import type { AdminContext } from '@/features/admin/types'

type AdminMobileNavigationProps = {
  context: AdminContext
}

export default function AdminMobileNavigation({ context }: AdminMobileNavigationProps){
  const [open, setOpen] = useState(false)
  const menuId = 'admin-mobile-navigation'

  return (
    <div className="lg:hidden">
      <button type="button" className="mb-4 min-h-11 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-uiussc-charcoal" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen((value) => !value)}>
        {open ? 'Close admin menu' : 'Admin menu'}
      </button>
      {open && (
        <nav id={menuId} className="mb-5 grid gap-2 rounded-md border border-slate-200 bg-white p-3 shadow-lg shadow-slate-900/5" aria-label="Mobile admin navigation">
          <AdminNavigationLinks permissions={context.permissions} onNavigate={() => setOpen(false)} />
          <Link href="/staff" onClick={() => setOpen(false)} className="rounded-md border border-slate-200 px-3 py-3 text-sm font-bold text-uiussc-charcoal">Staff Dashboard</Link>
          <Link href="/" onClick={() => setOpen(false)} className="rounded-md border border-slate-200 px-3 py-3 text-sm font-bold text-uiussc-charcoal">Public Site</Link>
          <form action={signOutAction}>
            <button type="submit" className="min-h-11 w-full rounded-md bg-uiussc-orange px-3 py-2 text-sm font-extrabold text-white">
              Log out
            </button>
          </form>
        </nav>
      )}
    </div>
  )
}
