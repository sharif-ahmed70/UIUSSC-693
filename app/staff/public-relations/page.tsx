import DepartmentWorkspace from '@/components/staff/DepartmentWorkspace'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import { requireDepartmentMembership } from '@/lib/auth/authorization'

export default async function PublicRelationsStaffPage(){
  const access = await getStaffAccessContext()
  const membership = requireDepartmentMembership(access, 'public-relations')
  return <DepartmentWorkspace slug="public-relations" departmentName="Public Relations" membership={membership} />
}
