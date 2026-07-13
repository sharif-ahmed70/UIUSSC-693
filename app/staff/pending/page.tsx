import Link from 'next/link'
import { redirect } from 'next/navigation'
import StatusPanel from '@/components/staff/StatusPanel'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import { resolveStaffDestination } from '@/features/staff/routing/resolveStaffDestination'

export default async function StaffPendingPage(){
  const access = await getStaffAccessContext()

  if (access.profile?.accountStatus === 'approved' && access.profile.onboardingStatus === 'approved') {
    redirect(resolveStaffDestination(access, '/staff'))
  }

  return (
    <StatusPanel eyebrow="Review pending" title="Your profile is under review" description="Your volunteer profile and department request are under review by UIUSSC administration.">
      <div className="space-y-3">
        <p className="font-bold text-uiussc-charcoal">{access.profile?.fullName}</p>
        {access.pendingMemberships.map((membership) => (
          <div key={membership.id} className="rounded-md border border-slate-200 bg-uiussc-ivory px-4 py-3 text-sm text-slate-700">
            {membership.department.name}: <span className="font-bold">{membership.status}</span>
          </div>
        ))}
        <Link href="/staff/onboarding" className="inline-flex text-sm font-bold text-uiussc-navy transition hover:text-uiussc-orange">
          Update allowed profile information
        </Link>
      </div>
    </StatusPanel>
  )
}
