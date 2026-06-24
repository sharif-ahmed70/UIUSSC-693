import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import StaffShell from '@/components/staff/StaffShell'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import { resolveStaffDestination } from '@/features/staff/routing/resolveStaffDestination'

export const dynamic = 'force-dynamic'

const openStaffStates = ['/staff/onboarding', '/staff/pending', '/staff/no-access', '/staff/access-status']

export default async function StaffLayout({ children }: { children: ReactNode }){
  const headerStore = await headers()
  const pathname = headerStore.get('x-uiussc-pathname') ?? '/staff'
  const access = await getStaffAccessContext()

  if (!access.userId) {
    redirect(`/login?next=${encodeURIComponent(pathname)}`)
  }

  const isOpenState = openStaffStates.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  const expectedDestination = resolveStaffDestination(access, pathname)

  if (!isOpenState && expectedDestination !== pathname && expectedDestination !== '/staff') {
    redirect(expectedDestination)
  }

  if (isOpenState) {
    return children
  }

  return <StaffShell access={access}>{children}</StaffShell>
}
