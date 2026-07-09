'use client'

import { useMemo, useState } from 'react'
import StatusBadge from '@/components/admin/StatusBadge'
import type { VolunteerDashboardTask } from '@/features/volunteer-dashboard/types'
import { formatDisplayDate } from '@/lib/date'

export default function TaskSnapshot({ tasks }: { tasks: VolunteerDashboardTask[] }){
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')
  const filtered = useMemo(() => tasks.filter((task) => {
    return (status === 'all' || task.status === status) && (priority === 'all' || task.priority === priority)
  }), [tasks, status, priority])

  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-orange">Task Snapshot</p>
          <h2 className="mt-2 text-xl font-extrabold text-uiussc-charcoal">Department tasks for selected event</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={status} onChange={(event) => setStatus(event.currentTarget.value)} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm">
            <option value="all">All status</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In progress</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
          </select>
          <select value={priority} onChange={(event) => setPriority(event.currentTarget.value)} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm">
            <option value="all">All priority</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div className="mt-5 overflow-auto">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-3 py-3">Task Name</th>
              <th className="px-3 py-3">Assigned To</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Progress</th>
              <th className="px-3 py-3">Deadline</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((task) => (
              <tr key={task.taskId} className="border-b border-slate-100">
                <td className="px-3 py-3 font-extrabold text-uiussc-charcoal">{task.taskName}</td>
                <td className="px-3 py-3 text-slate-600">{task.assignedTo}</td>
                <td className="px-3 py-3"><StatusBadge status={task.status} /></td>
                <td className="px-3 py-3 font-bold text-slate-700">{task.progressPercent}%</td>
                <td className="px-3 py-3 text-slate-600">{task.deadline ? formatDisplayDate(task.deadline) : 'Not set'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-5 text-sm font-bold text-slate-600">No tasks match the selected filters.</p>}
      </div>
    </section>
  )
}
