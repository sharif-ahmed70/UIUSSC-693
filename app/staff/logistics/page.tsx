import DepartmentWorkspace from '@/components/staff/DepartmentWorkspace'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import { requireDepartmentMembership } from '@/lib/auth/authorization'

export default async function LogisticsStaffPage(){
  const access = await getStaffAccessContext()
  const membership = requireDepartmentMembership(access, 'logistics')
  return <DepartmentWorkspace slug="logistics" departmentName="Logistics" membership={membership} />
}
