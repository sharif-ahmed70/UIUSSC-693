import AdminActionForm from '@/components/admin/AdminActionForm'
import AdminHeader from '@/components/admin/AdminHeader'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import StatusBadge from '@/components/admin/StatusBadge'
import { assignPlatformRoleAction, revokePlatformRoleAction } from '@/features/admin/actions/platformRoleActions'
import { getPlatformRoles } from '@/features/admin/queries/getPlatformRoles'
import { formatPlatformRole } from '@/lib/formatters'

export default async function PlatformRolesPage(){
  const roles = await getPlatformRoles()

  return (
    <div>
      <AdminHeader title="Platform roles" description="Super-admin-only role assignment and revocation. The final active super admin cannot be revoked." />
      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <h2 className="font-extrabold">Platform roles are active</h2>
        <p className="mt-2 text-sm leading-6">Only Super Admins can assign or revoke platform roles. The final active Super Admin cannot be revoked.</p>
      </section>
      <section className="mb-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Assign platform role</h2>
        <div className="mt-4">
          <AdminActionForm action={assignPlatformRoleAction} submitLabel="Assign role" fields={
            <>
              <input name="profileId" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Approved volunteer profile UUID" required />
              <select name="role" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" required>
                <option value="membership_admin">Membership Admin</option>
                <option value="club_admin">Club Admin</option>
                <option value="content_admin">Content Admin</option>
                <option value="department_admin">Department Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm" placeholder="Reason" required />
            </>
          } />
        </div>
      </section>
      {roles.length === 0 ? <EmptyAdminState message="No platform roles have been assigned." /> : (
        <div className="grid gap-3">
          {roles.map((role) => (
            <article key={role.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-extrabold text-uiussc-charcoal">{role.volunteer_profiles?.full_name ?? role.volunteer_profile_id}</h2>
                  <p className="mt-1 text-sm text-slate-600">{formatPlatformRole(role.role)}</p>
                </div>
                <StatusBadge status={role.status} />
              </div>
              {role.status === 'active' && (
                <div className="mt-4">
                  <AdminActionForm action={revokePlatformRoleAction} id={role.id} submitLabel="Revoke role" danger fields={<textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm" placeholder="Reason" required />} />
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
