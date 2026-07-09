import Link from 'next/link'
import type { VolunteerDashboardNotification } from '@/features/volunteer-dashboard/types'
import { formatDisplayDate } from '@/lib/date'

export default function NotificationPanel({ notifications }: { notifications: VolunteerDashboardNotification[] }){
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-orange">Notifications</p>
      <h2 className="mt-2 text-xl font-extrabold text-uiussc-charcoal">Alerts and reminders</h2>
      <div className="mt-5 grid gap-3">
        {notifications.map((notification) => {
          const content = (
            <article className="rounded-md border border-slate-200 p-4 transition hover:border-uiussc-orange">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-uiussc-ivory px-2 py-1 text-xs font-extrabold text-uiussc-charcoal">{notification.category}</span>
                <span className="rounded-md bg-orange-50 px-2 py-1 text-xs font-extrabold text-uiussc-orange">{notification.severity}</span>
              </div>
              <h3 className="mt-3 font-extrabold text-uiussc-charcoal">{notification.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{notification.body}</p>
              <p className="mt-2 text-xs font-bold text-slate-500">{formatDisplayDate(notification.createdAt)}</p>
            </article>
          )

          return notification.targetUrl ? <Link key={notification.id} href={notification.targetUrl}>{content}</Link> : <div key={notification.id}>{content}</div>
        })}
        {notifications.length === 0 && <p className="text-sm font-bold text-slate-600">No notifications are available.</p>}
      </div>
    </section>
  )
}
