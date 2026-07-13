import DepartmentWorkspace from '@/components/staff/DepartmentWorkspace'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import { requireDepartmentMembership } from '@/lib/auth/authorization'

export default async function EventManagementStaffPage(){
  const access = await getStaffAccessContext()
  const membership = requireDepartmentMembership(access, 'event-management')
  return <DepartmentWorkspace slug="event-management" departmentName="Event Management" membership={membership} />
}
