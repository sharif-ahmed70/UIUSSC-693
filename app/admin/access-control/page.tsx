import AdminActionForm from '@/components/admin/AdminActionForm'
import AdminHeader from '@/components/admin/AdminHeader'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import StatusBadge from '@/components/admin/StatusBadge'
import { grantTemporaryAccessAction, revokeTemporaryAccessAction } from '@/features/access-control/actions'
import { getAccessControlSummary } from '@/features/access-control/queries'
import { maskEmail } from '@/lib/formatters'

export default async function AccessControlPage(){
  const data = await getAccessControlSummary()

  return (
    <div>
      <AdminHeader title="Access control" description="Permission catalogue, temporary access grants, restrictions, and expiry-aware governance for UIUSSC staff accounts." />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <h2 className="font-extrabold">Temporary access is controlled by RPC</h2>
        <p className="mt-2 text-sm leading-6">Deny overrides take precedence over role permissions. Expired grants stop working by timestamp even before any cleanup job updates their status.</p>
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Grant or restrict temporary access</h2>
        <div className="mt-4">
          <AdminActionForm action={grantTemporaryAccessAction} submitLabel="Create temporary access" fields={
            <>
              <input name="profileId" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Volunteer profile UUID" required />
              <select name="permissionKey" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" required>
                {data.permissions.map((permission) => (
                  <option key={permission.id} value={permission.permission_key}>{permission.permission_key}</option>
                ))}
              </select>
              <select name="effect" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" required>
                <option value="allow">Allow</option>
                <option value="deny">Deny / restrict</option>
              </select>
              <select name="scopeType" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" required>
                <option value="global">Global</option>
                <option value="department">Department</option>
                <option value="event">Event</option>
                <option value="record">Record</option>
              </select>
              <input name="departmentId" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Department UUID when scoped" />
              <input name="eventId" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Event UUID when scoped" />
              <input name="targetRecordType" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Record type when scoped" />
              <input name="targetRecordId" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Record UUID when scoped" />
              <input name="startsAt" type="datetime-local" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" />
              <input name="expiresAt" type="datetime-local" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" />
              <textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm" placeholder="Reason" required />
            </>
          } />
        </div>
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Permission catalogue</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.permissions.map((permission) => (
            <article key={permission.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-extrabold text-uiussc-charcoal">{permission.permission_key}</h3>
                <StatusBadge status={permission.risk_level} />
              </div>
              <p className="mt-2 text-sm text-slate-600">{permission.name}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Temporary grants and restrictions</h2>
        <div className="mt-4 grid gap-3">
          {data.overrides.length === 0 ? <EmptyAdminState message="No temporary access grants or restrictions have been recorded." /> : data.overrides.map((override) => (
            <article key={override.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-uiussc-charcoal">{override.system_permissions?.permission_key ?? override.permission_id}</h3>
                  <p className="mt-1 text-sm text-slate-600">{override.volunteer_profiles?.full_name ?? override.volunteer_profile_id} {maskEmail(override.volunteer_profiles?.email) ? `(${maskEmail(override.volunteer_profiles?.email)})` : ''}</p>
                  <p className="mt-1 text-sm text-slate-600">{override.effect} · {override.scope_type} · expires {override.expires_at ?? 'manually'}</p>
                </div>
                <StatusBadge status={override.status} />
              </div>
              {override.status === 'active' || override.status === 'scheduled' ? (
                <div className="mt-4 max-w-md">
                  <AdminActionForm action={revokeTemporaryAccessAction} id={override.id} submitLabel="Revoke access" danger fields={<textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm" placeholder="Reason" required />} />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
