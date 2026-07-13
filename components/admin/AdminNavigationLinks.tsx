'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { adminNavigation } from '@/features/admin/permissions/adminPermissions'
import type { AdminPermissions } from '@/features/admin/types'

type AdminNavigationLinksProps = {
  permissions: AdminPermissions
  onNavigate?: () => void
}

export default function AdminNavigationLinks({ permissions, onNavigate }: AdminNavigationLinksProps){
  const pathname = usePathname()

  return (
    <>
      {adminNavigation(permissions).map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`rounded-md px-3 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20 ${
              active ? 'bg-uiussc-charcoal text-white' : 'text-slate-700 hover:bg-uiussc-ivory hover:text-uiussc-orange'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </>
  )
}
