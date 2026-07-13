import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import AccessDenied from '@/components/admin/AccessDenied'
import AdminMobileNavigation from '@/components/admin/AdminMobileNavigation'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { getAdminContext } from '@/features/admin/queries/getAdminContext'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }){
  const context = await getAdminContext()

  if (!context.staff.userId) {
    redirect('/login?next=/admin')
  }

  if (!context.isAdmin) {
    return (
      <div className="bg-uiussc-ivory">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <AccessDenied />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-uiussc-ivory">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[18rem_1fr]">
        <div className="hidden lg:block">
          <AdminSidebar context={context} />
        </div>
        <main className="min-w-0">
          <AdminMobileNavigation context={context} />
          {children}
        </main>
      </div>
    </div>
  )
}
