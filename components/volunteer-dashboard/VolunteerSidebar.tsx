import Link from 'next/link'
import type { VolunteerDashboardModule } from '@/features/volunteer-dashboard/types'

const modules: Array<{ key: VolunteerDashboardModule; label: string; description: string }> = [
  { key: 'attendance', label: 'Attendance', description: 'Meeting and booth records' },
  { key: 'tasks', label: 'Assigned Tasks', description: 'Department event tasks' },
  { key: 'events', label: 'Event Participation', description: 'Upcoming and past events' },
  { key: 'committee', label: 'Committee Memberships', description: 'Current and history' },
  { key: 'blood', label: 'Donor Tracking', description: 'Read-only assignments' },
  { key: 'notifications', label: 'Notifications', description: 'Reminders and alerts' },
]

export default function VolunteerSidebar({
  activeModule,
  eventId,
  counts,
}: {
  activeModule: VolunteerDashboardModule
  eventId?: string | null
  counts: Partial<Record<VolunteerDashboardModule, number>>
}){
  const queryEvent = eventId ? `&eventId=${eventId}` : ''

  return (
    <aside className="rounded-md border border-slate-200 bg-white p-3 shadow-lg shadow-slate-900/5 lg:sticky lg:top-28">
      <div className="mb-3 border-b border-slate-200 px-2 pb-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-orange">Volunteer Dept.</p>
        <h2 className="mt-1 text-lg font-extrabold text-uiussc-charcoal">Dashboard</h2>
      </div>
      <nav className="grid gap-2" aria-label="Volunteer department modules">
        {modules.map((item) => {
          const active = item.key === activeModule
          const count = counts[item.key] ?? 0

          return (
            <Link
              key={item.key}
              href={`/staff/volunteer/dashboard?module=${item.key}${queryEvent}`}
              className={`rounded-md border p-3 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20 ${
                active
                  ? 'border-uiussc-orange bg-orange-50 text-uiussc-charcoal'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-uiussc-orange hover:bg-uiussc-ivory'
              }`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-extrabold">{item.label}</span>
                {count > 0 && <span className="rounded-full bg-uiussc-charcoal px-2 py-0.5 text-xs font-bold text-white">{count}</span>}
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
