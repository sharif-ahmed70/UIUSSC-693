import AdminActionForm from '@/components/admin/AdminActionForm'
import AdminHeader from '@/components/admin/AdminHeader'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import FilterBar from '@/components/admin/FilterBar'
import Pagination from '@/components/admin/Pagination'
import StatusBadge from '@/components/admin/StatusBadge'
import { approveDepartmentMembershipAction, changeDepartmentRoleAction, rejectDepartmentMembershipAction, removeDepartmentMembershipAction, setPrimaryDepartmentAction, suspendDepartmentMembershipAction } from '@/features/admin/actions/departmentMembershipActions'
import { getDepartmentMemberships } from '@/features/admin/queries/getDepartmentMemberships'
import { parseAdminListParams } from '@/features/admin/queries/listParams'

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function DepartmentMembershipsPage({ searchParams }: PageProps){
  const params = parseAdminListParams(await searchParams)
  const data = await getDepartmentMemberships(params)

  return (
    <div>
      <AdminHeader title="Department memberships" description="Approve, reject, suspend, remove, and assign department roles for verified volunteers." />
      <FilterBar statuses={['requested', 'under_review', 'approved', 'rejected', 'suspended', 'removed']} />
      {data.items.length === 0 ? <EmptyAdminState /> : (
        <div className="grid gap-4">
          {data.items.map((item) => (
            <article key={item.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-extrabold text-uiussc-charcoal">{item.volunteer_profiles?.full_name ?? 'Volunteer'}</h2>
                  <p className="mt-1 break-all text-sm text-slate-600">{item.volunteer_profiles?.email} · {item.club_departments?.name}</p>
                  <p className="mt-1 text-sm text-slate-600">Role: {item.department_role}{item.is_primary ? ' · primary' : ''}</p>
                </div>
                <StatusBadge status={item.membership_status} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <AdminActionForm action={approveDepartmentMembershipAction} id={item.id} submitLabel="Approve" />
                <AdminActionForm action={setPrimaryDepartmentAction} id={item.id} submitLabel="Set primary" />
                <AdminActionForm action={changeDepartmentRoleAction} id={item.id} submitLabel="Change role" fields={<RoleFields />} />
                <AdminActionForm action={rejectDepartmentMembershipAction} id={item.id} submitLabel="Reject" danger fields={<ReasonField />} />
                <AdminActionForm action={suspendDepartmentMembershipAction} id={item.id} submitLabel="Suspend" danger fields={<ReasonField />} />
                <AdminActionForm action={removeDepartmentMembershipAction} id={item.id} submitLabel="Remove" danger fields={<ReasonField />} />
              </div>
            </article>
          ))}
        </div>
      )}
      <Pagination page={params.page} pageSize={params.pageSize} count={data.count} basePath="/admin/department-memberships" />
    </div>
  )
}

function ReasonField(){
  return <textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm" placeholder="Reason" required />
}

function RoleFields(){
  return (
    <>
      <select name="role" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" required>
        <option value="executive">Executive</option>
        <option value="deputy_head">Deputy Head</option>
        <option value="department_head">Department Head</option>
      </select>
      <ReasonField />
    </>
  )
}
