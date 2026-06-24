import { notFound } from 'next/navigation'
import AdminActionForm from '@/components/admin/AdminActionForm'
import StatusBadge from '@/components/admin/StatusBadge'
import { changeTaskStatusAction, updateTaskProgressAction } from '@/features/event-tasks/actions'
import { getEventTaskDetail } from '@/features/event-tasks/queries'
import { formatDisplayDate, formatEventDate } from '@/lib/date'

export default async function StaffTaskDetailPage({ params }: { params: Promise<{ id: string }> }){
  const { id } = await params
  const task = await getEventTaskDetail(id)
  if (!task) notFound()

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
