import DepartmentWorkspace from '@/components/staff/DepartmentWorkspace'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import { requireDepartmentMembership } from '@/lib/auth/authorization'

export default async function GraphicsDesignStaffPage(){
  const access = await getStaffAccessContext()
  const membership = requireDepartmentMembership(access, 'graphics-design')
  return <DepartmentWorkspace slug="graphics-design" departmentName="Graphics Design" membership={membership} />
}
