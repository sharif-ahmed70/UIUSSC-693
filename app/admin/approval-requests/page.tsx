import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminActionForm from '@/components/admin/AdminActionForm'
import AdminHeader from '@/components/admin/AdminHeader'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import StatusBadge from '@/components/admin/StatusBadge'
import { executeApprovalRequestAction, reviewApprovalRequestAction } from '@/features/approvals/actions'
import { getApprovalRequests } from '@/features/approvals/queries'
import { getAdminContext } from '@/features/admin/queries/getAdminContext'
import { maskEmail } from '@/lib/formatters'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const filters = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'executed', label: 'Executed' },
  { value: 'expired', label: 'Expired' },
  { value: 'my-requests', label: 'My Requests' },
  { value: 'needs-my-approval', label: 'Needs My Approval' },
] as const

export default async function ApprovalRequestsPage({ searchParams }: PageProps){
  const params = await searchParams
  const filter = typeof params.filter === 'string' ? params.filter : 'pending'
  const [context, requests] = await Promise.all([getAdminContext(), getApprovalRequests()])

  if (!context.permissions.canReviewApprovalRequests) {
    notFound()
  }

  const visibleRequests = requests.filter((request) => {
    if (filter === 'my-requests') return request.requester_profile_id === context.staff.profile?.id
    if (filter === 'needs-my-approval') return request.request_status === 'pending' && request.requester_profile_id !== context.staff.profile?.id
    return request.request_status === filter
  })

  return (
    <div>
      <AdminHeader title="Approval requests" description="Maker-checker workflow for sensitive UIUSSC administration. Approval and execution are separate steps." />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <h2 className="font-extrabold">President or Super Admin review required</h2>
        <p className="mt-2 text-sm leading-6">VP/GS sensitive actions are recorded here for review. Execution uses explicit allowlisted RPC branches only.</p>
      </section>

      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Approval filters">
        {filters.map((item) => (
          <Link key={item.value} href={`/admin/approval-requests?filter=${item.value}`} className={`rounded-md border px-3 py-2 text-sm font-extrabold transition ${filter === item.value ? 'border-uiussc-orange bg-uiussc-orange text-white' : 'border-slate-200 bg-white text-uiussc-charcoal hover:border-uiussc-orange hover:text-uiussc-orange'}`}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="grid gap-4">
        {visibleRequests.length === 0 ? <EmptyAdminState message="No approval requests match this filter." /> : visibleRequests.map((request) => (
          <article key={request.id} className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-extrabold text-uiussc-charcoal">{formatActionLabel(request.action_key)}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Requested by {request.requester?.full_name ?? 'Staff member'} {maskEmail(request.requester?.email) ? `(${maskEmail(request.requester?.email)})` : ''}
                </p>
                <p className="mt-1 text-sm text-slate-600">{formatTarget(request.target_type, request.scope_type)}</p>
              </div>
              <StatusBadge status={request.request_status} />
            </div>
            <p className="mt-4 rounded-md bg-uiussc-ivory p-3 text-sm leading-6 text-slate-700">{request.reason}</p>

            {request.approval_request_actions.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-extrabold text-uiussc-charcoal">Timeline</h3>
                <div className="mt-2 grid gap-2">
                  {request.approval_request_actions.map((action) => (
                    <p key={action.id} className="rounded-md border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600">
                      {formatActionLabel(action.action_type)} · {new Date(action.created_at).toLocaleString()}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {request.request_status === 'pending' && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <AdminActionForm action={reviewApprovalRequestAction} id={request.id} submitLabel="Approve request" fields={
                  <>
                    <input type="hidden" name="decision" value="approved" />
                    <label className="grid gap-2 text-sm font-bold text-uiussc-charcoal">
                      Approval reason <span className="text-red-700">*</span>
                      <textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm font-normal" required />
                    </label>
                  </>
                } />
                <AdminActionForm action={reviewApprovalRequestAction} id={request.id} submitLabel="Reject request" danger fields={
                  <>
                    <input type="hidden" name="decision" value="rejected" />
                    <label className="grid gap-2 text-sm font-bold text-uiussc-charcoal">
                      Rejection reason <span className="text-red-700">*</span>
                      <textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm font-normal" required />
                    </label>
                  </>
                } />
              </div>
            )}

            {request.request_status === 'approved' && (
              <div className="mt-4 max-w-md rounded-md border border-amber-200 bg-amber-50 p-4">
                <p className="mb-3 text-sm font-bold text-amber-900">This request is approved but not executed. Execution changes data through an allowlisted RPC branch.</p>
                <AdminActionForm action={executeApprovalRequestAction} id={request.id} submitLabel="Execute approved request" fields={
                  <>
                    <label className="flex gap-2 text-sm font-bold text-uiussc-charcoal">
                      <input type="checkbox" required name="confirmExecution" value="yes" />
                      I understand this executes the approved action.
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-uiussc-charcoal">
                      Execution reason <span className="text-red-700">*</span>
                      <textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm font-normal" required />
                    </label>
                  </>
                } />
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

function formatActionLabel(value: string){
  return value.replaceAll('.', ' ').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatTarget(targetType: string, scopeType: string){
  return `Target: ${targetType.replaceAll('_', ' ')} · Scope: ${scopeType.replaceAll('_', ' ')}`
}
