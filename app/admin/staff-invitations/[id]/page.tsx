import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminHeader from '@/components/admin/AdminHeader'
import StatusBadge from '@/components/admin/StatusBadge'
import { getStaffInvitations } from '@/features/invitations/queries'
import { formatDepartmentRole, formatPlatformRole, maskEmail } from '@/lib/formatters'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function StaffInvitationDetailPage({ params }: PageProps){
  const { id } = await params
  const invitation = (await getStaffInvitations()).find((item) => item.id === id)

  if (!invitation) {
    notFound()
  }

  return (
    <div>
      <AdminHeader title="Review invitation plan" description="Invitation intent is shown for administrator review. Actual account access still requires separate onboarding, approval, role, position, and department workflows." />
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-uiussc-charcoal">{invitation.invited_name ?? 'Staff invitee'}</h2>
            <p className="mt-1 text-sm text-slate-600">{maskEmail(invitation.normalized_email)}</p>
          </div>
          <StatusBadge status={invitation.invitation_status} />
        </div>

        <dl className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-md bg-uiussc-ivory p-3">
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Intended platform role</dt>
            <dd className="mt-1 font-extrabold text-uiussc-charcoal">{invitation.intended_platform_role ? formatPlatformRole(invitation.intended_platform_role) : 'None'}</dd>
          </div>
          <div className="rounded-md bg-uiussc-ivory p-3">
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Intended club position</dt>
            <dd className="mt-1 font-extrabold text-uiussc-charcoal">{invitation.club_positions?.name ?? 'None'}</dd>
          </div>
          <div className="rounded-md bg-uiussc-ivory p-3">
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Delivery mode</dt>
            <dd className="mt-1 font-extrabold text-uiussc-charcoal">Operator assisted</dd>
          </div>
          <div className="rounded-md bg-uiussc-ivory p-3">
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Expires</dt>
            <dd className="mt-1 font-extrabold text-uiussc-charcoal">{new Date(invitation.expires_at).toLocaleString()}</dd>
          </div>
        </dl>

        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Use the Supabase Dashboard invite flow manually until a server-only invitation delivery path is configured. Do not share passwords or invite tokens in this application.
        </div>

        {invitation.staff_invitation_department_scopes.length > 0 && (
          <div className="mt-5">
            <h3 className="font-extrabold text-uiussc-charcoal">Intended department scopes</h3>
            <div className="mt-3 grid gap-2">
              {invitation.staff_invitation_department_scopes.map((scope) => (
                <p key={scope.id} className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  {scope.club_departments?.name ?? scope.department_id} · {formatDepartmentRole(scope.intended_department_role)}
                </p>
              ))}
            </div>
          </div>
        )}

        <Link href="/admin/staff-invitations" className="mt-5 inline-flex rounded-md border border-slate-200 px-4 py-2 text-sm font-extrabold text-uiussc-charcoal transition hover:border-uiussc-orange hover:text-uiussc-orange">Back to staff invitations</Link>
      </section>
    </div>
  )
}
