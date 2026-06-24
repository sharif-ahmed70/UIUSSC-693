import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminActionForm from '@/components/admin/AdminActionForm'
import AdminHeader from '@/components/admin/AdminHeader'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import InvitationPlanForm from '@/components/admin/InvitationPlanForm'
import StatusBadge from '@/components/admin/StatusBadge'
import { cancelStaffInvitationAction, createStaffInvitationAction } from '@/features/invitations/actions'
import { invitationMessages } from '@/features/invitations/errors'
import { getInvitationFormOptions, getStaffInvitations } from '@/features/invitations/queries'
import { getAdminContext } from '@/features/admin/queries/getAdminContext'
import { formatDepartmentRole, formatPlatformRole, maskEmail } from '@/lib/formatters'

export default async function StaffInvitationsPage(){
  const [context, invitations, options] = await Promise.all([getAdminContext(), getStaffInvitations(), getInvitationFormOptions()])

  if (!context.permissions.canCreateStaffInvitations) {
    notFound()
  }

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
          <InvitationPlanForm action={createStaffInvitationAction} options={options} />
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
                    Intended role: {invitation.intended_platform_role ? formatPlatformRole(invitation.intended_platform_role) : 'None'} · position: {invitation.club_positions?.name ?? 'None'} · expires {new Date(invitation.expires_at).toLocaleString()}
                  </p>
                  {invitation.staff_invitation_department_scopes.length > 0 && (
                    <p className="mt-1 text-sm text-slate-600">
                      {invitation.staff_invitation_department_scopes.map((scope) => `${scope.club_departments?.name ?? 'Department'}: ${formatDepartmentRole(scope.intended_department_role)}`).join(' · ')}
                    </p>
                  )}
                </div>
                <StatusBadge status={invitation.invitation_status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={`/admin/staff-invitations/${invitation.id}`} className="inline-flex rounded-md border border-slate-200 px-4 py-2 text-sm font-extrabold text-uiussc-charcoal transition hover:border-uiussc-orange hover:text-uiussc-orange">Review plan</Link>
              </div>
              {['draft', 'ready', 'sent', 'operator_assisted'].includes(invitation.invitation_status) && (
                <div className="mt-4 max-w-md">
                  <AdminActionForm action={cancelStaffInvitationAction} id={invitation.id} submitLabel="Cancel invitation" danger fields={
                    <label className="grid gap-2 text-sm font-bold text-uiussc-charcoal">
                      Cancellation reason <span className="text-red-700">*</span>
                      <textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm font-normal" required />
                    </label>
                  } />
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
