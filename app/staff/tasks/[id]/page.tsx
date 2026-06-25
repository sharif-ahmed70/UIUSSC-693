import { notFound } from 'next/navigation'
import AdminActionForm from '@/components/admin/AdminActionForm'
import EvidenceLinkFields from '@/components/staff/EvidenceLinkFields'
import StatusBadge from '@/components/admin/StatusBadge'
import { changeTaskStatusAction, reviewTaskSubmissionAction, submitTaskWorkAction, updateTaskProgressAction, withdrawTaskSubmissionAction } from '@/features/event-tasks/actions'
import { getEventTaskDetail } from '@/features/event-tasks/queries'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import { formatDisplayDate, formatEventDate } from '@/lib/date'

export default async function StaffTaskDetailPage({ params }: { params: Promise<{ id: string }> }){
  const { id } = await params
  const [task, access] = await Promise.all([getEventTaskDetail(id), getStaffAccessContext()])
  if (!task) notFound()
  const profileId = access.profile?.id
  const isActiveAssignee = Boolean(profileId && task.assignees.some((assignee) => assignee.profileId === profileId && assignee.status === 'active'))
  const canSubmit = isActiveAssignee && task.progressPercent === 100 && !task.hasActionableSubmission && !['completed', 'cancelled'].includes(task.status)
  const canReview = Boolean(profileId && profileId !== task.submissions[0]?.submittedBy && (access.platformRoles.includes('super_admin') || access.platformRoles.includes('club_admin') || access.approvedMemberships.some((membership) => membership.department.id === task.departmentId && ['department_head', 'deputy_head'].includes(membership.role))))

  return (
    <div className="space-y-6">
      <section className="rounded-md bg-uiussc-charcoal p-6 text-white shadow-xl shadow-slate-900/10">
        <div className="flex flex-wrap gap-2"><StatusBadge status={task.status} /><StatusBadge status={task.priority} /></div>
        <h1 className="mt-3 text-3xl font-extrabold">{task.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{task.eventTitle} · {formatEventDate(task.eventDate)} · {task.departmentName}</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <h2 className="text-xl font-extrabold text-uiussc-charcoal">Task information</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{task.description}</p>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="font-bold text-slate-500">Responsibility</dt><dd className="mt-1 text-uiussc-charcoal">{task.assignmentTitle}</dd></div>
            <div><dt className="font-bold text-slate-500">Due</dt><dd className="mt-1 text-uiussc-charcoal">{task.dueAt ? formatDisplayDate(task.dueAt) : 'Not set'}</dd></div>
            <div><dt className="font-bold text-slate-500">Primary</dt><dd className="mt-1 text-uiussc-charcoal">{task.primaryAssigneeName ?? 'Unassigned'}</dd></div>
            <div><dt className="font-bold text-slate-500">Progress</dt><dd className="mt-1 text-uiussc-charcoal">{task.progressPercent}%</dd></div>
          </dl>
        </article>

        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <h2 className="text-xl font-extrabold text-uiussc-charcoal">Progress update</h2>
          <AdminActionForm
            action={updateTaskProgressAction}
            id={task.id}
            submitLabel="Update progress"
            fields={
              <div className="grid gap-3">
                <label htmlFor="progressPercent" className="grid gap-2 text-sm font-bold text-uiussc-charcoal">Progress percent
                  <input id="progressPercent" name="progressPercent" type="number" min="0" max="100" defaultValue={task.progressPercent} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 font-normal text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
                </label>
                <textarea name="reason" placeholder="Optional progress note" className="min-h-16 rounded-md border border-slate-200 p-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
              </div>
            }
          />
          <div className="mt-5">
            <AdminActionForm
              action={changeTaskStatusAction}
              id={task.id}
              submitLabel="Change status"
              fields={
                <div className="grid gap-3">
                  <select name="status" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
                    <option value="in_progress">In progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="ready_for_review">Ready for review</option>
                  </select>
                  <textarea name="reason" placeholder="Reason required when blocked" className="min-h-16 rounded-md border border-slate-200 p-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
                </div>
              }
            />
          </div>
        </section>
      </section>

      {canSubmit && (
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <h2 className="text-xl font-extrabold text-uiussc-charcoal">Submit work for review</h2>
          <div className="mt-4">
            <AdminActionForm
              action={submitTaskWorkAction}
              id={task.id}
              submitLabel="Submit work"
              fields={
                <div className="grid gap-4">
                  <label htmlFor="summary" className="grid gap-2 text-sm font-bold text-uiussc-charcoal">Summary
                    <textarea id="summary" name="summary" required className="min-h-28 rounded-md border border-slate-200 p-3 font-normal text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
                  </label>
                  <label htmlFor="completionNote" className="grid gap-2 text-sm font-bold text-uiussc-charcoal">Completion note
                    <textarea id="completionNote" name="completionNote" className="min-h-20 rounded-md border border-slate-200 p-3 font-normal text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
                  </label>
                  <EvidenceLinkFields />
                </div>
              }
            />
          </div>
        </section>
      )}

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Submissions</h2>
        <div className="mt-4 grid gap-4">
          {task.submissions.length === 0 ? <p className="text-sm font-bold text-slate-600">No submissions yet.</p> : task.submissions.map((submission) => (
            <article key={submission.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-extrabold text-uiussc-charcoal">Version {submission.submissionNumber}</h3><StatusBadge status={submission.status} /></div>
              <p className="mt-2 text-sm text-slate-600">Submitted {formatDisplayDate(submission.submittedAt)}</p>
              <p className="mt-3 text-sm leading-6 text-slate-700">{submission.summary}</p>
              {submission.completionNote && <p className="mt-2 text-sm leading-6 text-slate-600">Note: {submission.completionNote}</p>}
              {submission.evidenceLinks.length > 0 && <div className="mt-3 grid gap-2">{submission.evidenceLinks.map((link) => <EvidenceLink key={link.id} label={link.label} url={link.url} type={link.evidenceType} />)}</div>}
              {submission.reviewNote && <p className="mt-3 text-sm leading-6 text-slate-600">Feedback: {submission.reviewNote}</p>}
              {(submission.status === 'submitted' || submission.status === 'under_review') && (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {canReview && <AdminActionForm action={reviewTaskSubmissionAction} id={submission.id} submitLabel="Approve" fields={<><input type="hidden" name="decision" value="approve" /><textarea name="reviewNote" placeholder="Optional approval note" className="min-h-16 rounded-md border border-slate-200 p-3 text-sm" /></>} />}
                  {canReview && <AdminActionForm action={reviewTaskSubmissionAction} id={submission.id} submitLabel="Request revision" fields={<><input type="hidden" name="decision" value="request_revision" /><textarea name="reviewNote" required placeholder="Revision feedback" className="min-h-16 rounded-md border border-slate-200 p-3 text-sm" /></>} />}
                  {(submission.submittedBy === profileId || canReview) && <AdminActionForm action={withdrawTaskSubmissionAction} id={submission.id} submitLabel="Withdraw" danger fields={<textarea name="reason" required placeholder="Withdrawal reason" className="min-h-16 rounded-md border border-slate-200 p-3 text-sm" />} />}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Status history</h2>
        <div className="mt-4 grid gap-3">
          {task.history.map((item) => (
            <div key={item.id} className="rounded-md border border-slate-200 px-4 py-3 text-sm text-slate-700">
              <span className="font-bold">{item.previousStatus ?? 'created'} → {item.newStatus}</span> · {item.previousProgress ?? 0}% → {item.newProgress ?? 0}% · {formatDisplayDate(item.changedAt)}
              {item.reason && <p className="mt-1 text-slate-500">{item.reason}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function EvidenceLink({ label, url, type }: { label: string; url: string; type: string }){
  const safeUrl = new URL(url)
  return (
    <a href={url} target="_blank" rel="noreferrer noopener" className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-uiussc-orange transition hover:border-uiussc-orange">
      {label} <span className="text-xs font-normal text-slate-500">({type}, {safeUrl.hostname})</span>
    </a>
  )
}
