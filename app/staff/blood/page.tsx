import DepartmentWorkspace from '@/components/staff/DepartmentWorkspace'
import { requireDepartmentMembership } from '@/lib/auth/authorization'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'

export default async function BloodStaffPage(){
  const access = await getStaffAccessContext()
  const membership = requireDepartmentMembership(access, 'blood')
  return (
    <div className="space-y-5">
      <DepartmentWorkspace slug="blood" departmentName="Blood Department" membership={membership} />
      <section className="rounded-md border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
        <h2 className="font-extrabold">Blood Support database foundation is ready</h2>
        <p className="mt-2 text-sm leading-6">Operational donor, request, matching, and donation interfaces will be implemented in the next phase.</p>
      </section>
    </div>
  )
}
