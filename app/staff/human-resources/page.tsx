import DepartmentWorkspace from '@/components/staff/DepartmentWorkspace'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import { requireDepartmentMembership } from '@/lib/auth/authorization'

export default async function HumanResourcesStaffPage(){
  const access = await getStaffAccessContext()
  const membership = requireDepartmentMembership(access, 'human-resources')
  return <DepartmentWorkspace slug="human-resources" departmentName="Human Resources" membership={membership} />
}
