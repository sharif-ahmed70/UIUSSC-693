import DepartmentWorkspace from '@/components/staff/DepartmentWorkspace'
import { requireDepartmentMembership } from '@/lib/auth/authorization'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'

export default async function BloodStaffPage(){
  const access = await getStaffAccessContext()
  const membership = requireDepartmentMembership(access, 'blood')
  return <DepartmentWorkspace slug="blood" departmentName="Blood Department" membership={membership} />
}
