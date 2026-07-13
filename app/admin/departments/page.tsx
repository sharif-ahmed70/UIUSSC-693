import AdminActionForm from '@/components/admin/AdminActionForm'
import AdminHeader from '@/components/admin/AdminHeader'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import StatusBadge from '@/components/admin/StatusBadge'
import { archiveDepartmentAction, createDepartmentAction, updateDepartmentAction } from '@/features/admin/actions/departmentActions'
import { getDepartments } from '@/features/admin/queries/getDepartments'

export default async function DepartmentsPage(){
  const departments = await getDepartments()

  return (
    <div>
      <AdminHeader title="Departments" description="Manage database-driven UIUSSC departments. Archived departments remain for history and are not deleted." />
      <section className="mb-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Create department</h2>
        <div className="mt-4">
          <AdminActionForm action={createDepartmentAction} submitLabel="Create department" fields={<DepartmentFields />} />
        </div>
      </section>
      {departments.length === 0 ? <EmptyAdminState /> : (
        <div className="grid gap-4">
          {departments.map((department) => (
            <article key={department.id} className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-extrabold text-uiussc-charcoal">{department.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">/{department.slug} · order {department.display_order}</p>
                  <p className="mt-2 text-sm text-slate-600">{department.short_description ?? 'No description'}</p>
                </div>
                <StatusBadge status={department.status} />
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <AdminActionForm action={updateDepartmentAction} id={department.id} submitLabel="Update department" fields={<DepartmentFields department={department} includeStatus />} />
                <AdminActionForm action={archiveDepartmentAction} id={department.id} submitLabel="Archive department" danger fields={<textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm" placeholder="Archive reason" required />} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

type Department = Awaited<ReturnType<typeof getDepartments>>[number]

function DepartmentFields({ department, includeStatus }: { department?: Department; includeStatus?: boolean }){
  return (
    <div className="grid gap-3">
      <input name="name" defaultValue={department?.name ?? ''} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Department name" required />
      <input name="slug" defaultValue={department?.slug ?? ''} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="department-slug" required />
      <textarea name="shortDescription" defaultValue={department?.short_description ?? ''} className="min-h-20 rounded-md border border-slate-200 p-3 text-sm" placeholder="Short description" />
      <input name="displayOrder" type="number" min="0" defaultValue={department?.display_order ?? 0} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" />
      {includeStatus && (
        <>
          <select name="status" defaultValue={department?.status ?? 'active'} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm" placeholder="Reason for change" />
        </>
      )}
    </div>
  )
}
