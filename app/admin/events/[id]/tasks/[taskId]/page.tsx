import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminActionForm from '@/components/admin/AdminActionForm'
import AdminHeader from '@/components/admin/AdminHeader'
import StatusBadge from '@/components/admin/StatusBadge'
import { assignTaskMemberAction, cancelTaskAction, changeTaskStatusAction, completeTaskAction, reviewTaskSubmissionAction, revokeTaskMemberAction, updateEventTaskAction, withdrawTaskSubmissionAction } from '@/features/event-tasks/actions'
import { getEligibleTaskMembers, getEventTaskDetail } from '@/features/event-tasks/queries'
import { formatDisplayDate, formatEventDate } from '@/lib/date'
import { maskEmail } from '@/lib/formatters'

export default async function AdminEventTaskDetailPage({ params }: { params: Promise<{ id: string; taskId: string }> }){
  const { id, taskId } = await params
  const task = await getEventTaskDetail(taskId)
  if (!task) notFound()
  if (task.operationId !== id) notFound()
  const members = await getEligibleTaskMembers(task.departmentId)

  return (
    <div>
      <Link href={`/admin/events/${id}/tasks`} className="mb-4 inline-flex text-sm font-bold text-uiussc-orange hover:text-[#e85d00]">Back to event tasks</Link>
      <AdminHeader title={task.title} description={`${task.eventTitle} · ${formatEventDate(task.eventDate)} · ${task.departmentName}`} />

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <div className="flex flex-wrap gap-2"><StatusBadge status={task.status} /><StatusBadge status={task.priority} /></div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{task.description}</p>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="font-bold text-slate-500">Department</dt><dd className="mt-1 text-uiussc-charcoal">{task.departmentName}</dd></div>
            <div><dt className="font-bold text-slate-500">Responsibility</dt><dd className="mt-1 text-uiussc-charcoal">{task.assignmentTitle}</dd></div>
            <div><dt className="font-bold text-slate-500">Progress</dt><dd className="mt-1 text-uiussc-charcoal">{task.progressPercent}%</dd></div>
            <div><dt className="font-bold text-slate-500">Due</dt><dd className="mt-1 text-uiussc-charcoal">{task.dueAt ? formatDisplayDate(task.dueAt) : 'Not set'}</dd></div>
          </dl>
        </article>

        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <h2 className="text-xl font-extrabold text-uiussc-charcoal">Update task</h2>
          <AdminActionForm action={updateEventTaskAction} id={task.id} submitLabel="Save task" fields={<TaskFields task={task} />} />
          <div className="mt-5 grid gap-3">
            <AdminActionForm action={changeTaskStatusAction} id={task.id} submitLabel="Change status" fields={<><select name="status" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm"><option value="assigned">Assigned</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="ready_for_review">Ready for review</option></select><textarea name="reason" placeholder="Reason for blocked status" className="min-h-16 rounded-md border border-slate-200 p-3 text-sm" /></>} />
            <AdminActionForm action={completeTaskAction} id={task.id} submitLabel="Complete task" fields={<textarea name="reason" placeholder="Completion note" className="min-h-16 rounded-md border border-slate-200 p-3 text-sm" />} />
            <AdminActionForm action={cancelTaskAction} id={task.id} submitLabel="Cancel task" danger fields={<textarea name="reason" required placeholder="Cancellation reason" className="min-h-16 rounded-md border border-slate-200 p-3 text-sm" />} />
          </div>
        </section>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <h2 className="text-xl font-extrabold text-uiussc-charcoal">Assignees</h2>
          <div className="mt-4 grid gap-3">
            {task.assignees.length === 0 ? <p className="text-sm font-bold text-slate-600">No active or historical assignees.</p> : task.assignees.map((assignee) => (
              <div key={assignee.id} className="rounded-md border border-slate-200 p-4">
                <div className="flex flex-wrap justify-between gap-2"><h3 className="font-extrabold text-uiussc-charcoal">{assignee.fullName}</h3><StatusBadge status={assignee.status} /></div>
                <p className="mt-1 text-sm text-slate-600">{maskEmail(assignee.email)} · {assignee.role}</p>
                {assignee.status === 'active' && <div className="mt-3"><AdminActionForm action={revokeTaskMemberAction} id={assignee.id} submitLabel="Revoke assignment" danger fields={<textarea name="reason" required placeholder="Revocation reason" className="min-h-16 rounded-md border border-slate-200 p-3 text-sm" />} /></div>}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <h2 className="text-xl font-extrabold text-uiussc-charcoal">Assign department member</h2>
          <AdminActionForm
            action={assignTaskMemberAction}
            id={task.id}
            submitLabel="Assign member"
            fields={
              <div className="grid gap-3">
                <label htmlFor="volunteerProfileId" className="grid gap-2 text-sm font-bold text-uiussc-charcoal">Member
                  <select id="volunteerProfileId" name="volunteerProfileId" required className="min-h-10 rounded-md border border-slate-200 px-3 py-2 font-normal text-slate-700">
                    <option value="">Select member</option>
                    {members.map((member) => <option key={member.profileId} value={member.profileId}>{member.fullName} - {maskEmail(member.email)} - {member.role.replaceAll('_', ' ')}</option>)}
                  </select>
                </label>
                <label htmlFor="assignmentRole" className="grid gap-2 text-sm font-bold text-uiussc-charcoal">Assignment role
                  <select id="assignmentRole" name="assignmentRole" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 font-normal text-slate-700">
                    <option value="contributor">Contributor</option>
                    <option value="primary">Primary</option>
                  </select>
                </label>
              </div>
            }
          />
        </article>
      </section>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Submission timeline</h2>
        <div className="mt-4 grid gap-4">
          {task.submissions.length === 0 ? <p className="text-sm font-bold text-slate-600">No submissions yet.</p> : task.submissions.map((submission) => (
            <article key={submission.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-extrabold text-uiussc-charcoal">Version {submission.submissionNumber}</h3>
                <StatusBadge status={submission.status} />
              </div>
              <p className="mt-2 text-sm text-slate-600">Submitted by {submission.submitterName ?? 'Staff member'} · {formatDisplayDate(submission.submittedAt)}</p>
              <p className="mt-3 text-sm leading-6 text-slate-700">{submission.summary}</p>
              {submission.completionNote && <p className="mt-2 text-sm leading-6 text-slate-600">Note: {submission.completionNote}</p>}
              {submission.evidenceLinks.length > 0 && (
                <div className="mt-3 grid gap-2">
                  {submission.evidenceLinks.map((link) => <EvidenceLink key={link.id} label={link.label} url={link.url} type={link.evidenceType} />)}
                </div>
              )}
              {submission.reviewedAt && <p className="mt-3 text-sm text-slate-600">Reviewed by {submission.reviewerName ?? 'Reviewer'} · {formatDisplayDate(submission.reviewedAt)}</p>}
              {submission.reviewNote && <p className="mt-2 text-sm leading-6 text-slate-600">Feedback: {submission.reviewNote}</p>}
              {(submission.status === 'submitted' || submission.status === 'under_review') && (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <AdminActionForm action={reviewTaskSubmissionAction} id={submission.id} submitLabel="Approve" fields={<><input type="hidden" name="decision" value="approve" /><textarea name="reviewNote" placeholder="Optional approval note" className="min-h-16 rounded-md border border-slate-200 p-3 text-sm" /></>} />
                  <AdminActionForm action={reviewTaskSubmissionAction} id={submission.id} submitLabel="Request revision" fields={<><input type="hidden" name="decision" value="request_revision" /><textarea name="reviewNote" required placeholder="Revision feedback" className="min-h-16 rounded-md border border-slate-200 p-3 text-sm" /></>} />
                  <AdminActionForm action={withdrawTaskSubmissionAction} id={submission.id} submitLabel="Withdraw" danger fields={<textarea name="reason" required placeholder="Withdrawal reason" className="min-h-16 rounded-md border border-slate-200 p-3 text-sm" />} />
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
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

function TaskFields({ task }: { task: { title: string; description: string; priority: string } }){
  return (
    <div className="grid gap-3">
      <input name="title" defaultValue={task.title} required className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" />
      <textarea name="description" defaultValue={task.description} required className="min-h-24 rounded-md border border-slate-200 p-3 text-sm" />
      <select name="priority" defaultValue={task.priority} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm">
        <option value="low">Low</option>
        <option value="normal">Normal</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
      <input name="dueAt" type="datetime-local" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" />
    </div>
  )
}
