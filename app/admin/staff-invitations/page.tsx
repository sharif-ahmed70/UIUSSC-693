import Link from 'next/link'
import AdminActionForm from '@/components/admin/AdminActionForm'
import AdminHeader from '@/components/admin/AdminHeader'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import StatusBadge from '@/components/admin/StatusBadge'
import { cancelStaffInvitationAction, createStaffInvitationAction } from '@/features/invitations/actions'
import { invitationMessages } from '@/features/invitations/errors'
import { getStaffInvitations } from '@/features/invitations/queries'
import { formatPlatformRole, maskEmail } from '@/lib/formatters'

export default async function StaffInvitationsPage(){
  const invitations = await getStaffInvitations()

  return (
    <div>
      <AdminHeader title="Staff invitations" description="Operator-assisted invitation plans for staff accounts. Invitation intent is not actual access." />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <h2 className="font-extrabold">Invitation delivery is not configured</h2>
        <p className="mt-2 text-sm leading-6">{invitationMessages.deliveryNotConfigured}</p>
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Create operator-assisted invitation plan</h2>
        <div className="mt-4">
          <AdminActionForm action={createStaffInvitationAction} submitLabel="Create invitation plan" fields={
            <>
              <input name="invitedEmail" type="email" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Invitee email" required />
              <input name="invitedName" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Invitee name" />
              <input name="intendedClubPositionId" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Intended club position UUID" />
              <select name="intendedPlatformRole" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm">
                <option value="">No platform role intent</option>
                <option value="club_admin">Club Admin</option>
                <option value="membership_admin">Membership Admin</option>
                <option value="content_admin">Content Admin</option>
                <option value="department_admin">Department Admin</option>
              </select>
              <input name="expiresAt" type="datetime-local" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" />
              <textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm" placeholder="Reason" required />
            </>
          } />
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Invitation plans</h2>
        <div className="mt-4 grid gap-3">
          {invitations.length === 0 ? <EmptyAdminState message="No staff invitation plans have been created." /> : invitations.map((invitation) => (
            <article key={invitation.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-uiussc-charcoal">{invitation.invited_name ?? 'Staff invitee'}</h3>
                  <p className="mt-1 text-sm text-slate-600">{maskEmail(invitation.normalized_email)}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Intended role: {invitation.intended_platform_role ? formatPlatformRole(invitation.intended_platform_role) : 'None'} · expires {new Date(invitation.expires_at).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={invitation.invitation_status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={`/admin/staff-invitations/${invitation.id}`} className="inline-flex rounded-md border border-slate-200 px-4 py-2 text-sm font-extrabold text-uiussc-charcoal transition hover:border-uiussc-orange hover:text-uiussc-orange">Review plan</Link>
              </div>
              {['draft', 'ready', 'sent', 'operator_assisted'].includes(invitation.invitation_status) && (
                <div className="mt-4 max-w-md">
                  <AdminActionForm action={cancelStaffInvitationAction} id={invitation.id} submitLabel="Cancel invitation" danger fields={<textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm" placeholder="Reason" required />} />
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
