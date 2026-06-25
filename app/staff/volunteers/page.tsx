import DepartmentWorkspace from '@/components/staff/DepartmentWorkspace'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import { requireDepartmentMembership } from '@/lib/auth/authorization'

export default async function VolunteerManagementStaffPage(){
  const access = await getStaffAccessContext()
  const membership = requireDepartmentMembership(access, 'volunteer-management')
  return <DepartmentWorkspace slug="volunteer-management" departmentName="Volunteer Management" membership={membership} />
}
