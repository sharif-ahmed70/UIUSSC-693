import AdminActionForm from '@/components/admin/AdminActionForm'
import AdminHeader from '@/components/admin/AdminHeader'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import StatusBadge from '@/components/admin/StatusBadge'
import { executeApprovalRequestAction, reviewApprovalRequestAction } from '@/features/approvals/actions'
import { getApprovalRequests } from '@/features/approvals/queries'
import { maskEmail } from '@/lib/formatters'

export default async function ApprovalRequestsPage(){
  const requests = await getApprovalRequests()

  return (
    <div>
      <AdminHeader title="Approval requests" description="Maker-checker workflow for sensitive UIUSSC administration. Requesters cannot approve their own requests." />

      <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <h2 className="font-extrabold">President or Super Admin review required</h2>
        <p className="mt-2 text-sm leading-6">VP/GS sensitive actions are recorded here for review. Execution uses explicit allowlisted RPC branches only.</p>
      </section>

      <div className="grid gap-4">
        {requests.length === 0 ? <EmptyAdminState message="No approval requests have been created." /> : requests.map((request) => (
          <article key={request.id} className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-extrabold text-uiussc-charcoal">{request.action_key}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Requested by {request.requester?.full_name ?? 'Staff member'} {maskEmail(request.requester?.email) ? `(${maskEmail(request.requester?.email)})` : ''}
                </p>
                <p className="mt-1 text-sm text-slate-600">Target: {request.target_type} · Scope: {request.scope_type}</p>
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
                      {action.action_type} · {new Date(action.created_at).toLocaleString()}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {request.request_status === 'pending' && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <AdminActionForm action={reviewApprovalRequestAction} id={request.id} submitLabel="Approve" fields={
                  <>
                    <input type="hidden" name="decision" value="approved" />
                    <textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm" placeholder="Approval reason" required />
                  </>
                } />
                <AdminActionForm action={reviewApprovalRequestAction} id={request.id} submitLabel="Reject" danger fields={
                  <>
                    <input type="hidden" name="decision" value="rejected" />
                    <textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm" placeholder="Rejection reason" required />
                  </>
                } />
              </div>
            )}

            {request.request_status === 'approved' && (
              <div className="mt-4 max-w-md">
                <AdminActionForm action={executeApprovalRequestAction} id={request.id} submitLabel="Execute approved request" fields={<textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm" placeholder="Execution reason" required />} />
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
