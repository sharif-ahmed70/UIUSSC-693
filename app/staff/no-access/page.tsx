import StatusPanel from '@/components/staff/StatusPanel'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'

export default async function StaffNoAccessPage(){
  const access = await getStaffAccessContext()

  return (
    <StatusPanel eyebrow="No department access" title="No active department membership" description="Your profile is approved, but no active department workspace is currently assigned to your account.">
      <div className="space-y-3">
        {access.pendingMemberships.length > 0 ? access.pendingMemberships.map((membership) => (
          <div key={membership.id} className="rounded-md border border-slate-200 bg-uiussc-ivory px-4 py-3 text-sm text-slate-700">
            {membership.department.name}: <span className="font-bold">{membership.status}</span>
          </div>
        )) : (
          <p className="text-sm text-slate-600">No department request is currently visible for this account.</p>
        )}
      </div>
    </StatusPanel>
  )
}
