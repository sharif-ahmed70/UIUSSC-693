import StatusPanel from '@/components/staff/StatusPanel'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'

const copy = {
  rejected: 'Staff access was not approved for this account. Please contact UIUSSC through the public contact page if you need clarification.',
  suspended: 'Staff access is temporarily unavailable for this account. Please contact UIUSSC through the public contact page.',
  archived: 'This account no longer has active staff access.',
  default: 'Your account does not currently have approved staff access.',
}

export default async function StaffAccessStatusPage(){
  const access = await getStaffAccessContext()
  const status = access.profile?.accountStatus
  const description = status === 'rejected' || status === 'suspended' || status === 'archived' ? copy[status] : copy.default

  return (
    <StatusPanel eyebrow="Access status" title="Staff access unavailable" description={description} />
  )
}
