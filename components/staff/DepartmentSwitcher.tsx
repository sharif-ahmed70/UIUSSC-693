'use client'

import { usePathname, useRouter } from 'next/navigation'
import { getDepartmentDestination } from '@/features/departments/getDepartmentDestination'
import type { StaffMembership } from '@/features/staff/types'

type DepartmentSwitcherProps = {
  memberships: StaffMembership[]
}

export default function DepartmentSwitcher({ memberships }: DepartmentSwitcherProps){
  const pathname = usePathname()
  const router = useRouter()

  if (memberships.length === 0) {
    return null
  }

  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      Department
      <select
        value={memberships.find((membership) => pathname.startsWith(getDepartmentDestination(membership.department.slug)))?.department.slug ?? ''}
        onChange={(event) => {
          if (event.target.value) {
            router.push(getDepartmentDestination(event.target.value))
          }
        }}
        className="min-h-11 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-uiussc-charcoal outline-none transition focus:border-uiussc-orange focus:ring-4 focus:ring-uiussc-orange/15"
      >
        <option value="">Staff dashboard</option>
        {memberships.map((membership) => (
          <option key={membership.id} value={membership.department.slug}>
            {membership.department.name} - {membership.role.replace('_', ' ')}{membership.isPrimary ? ' - primary' : ''}
          </option>
        ))}
      </select>
    </label>
  )
}
