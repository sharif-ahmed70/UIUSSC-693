import Link from 'next/link'
import { redirect } from 'next/navigation'
import AdminActionForm from '@/components/admin/AdminActionForm'
import EmptyState from '@/components/states/EmptyState'
import { markAllNotificationsReadAction, markNotificationReadAction, updateNotificationPreferencesAction } from '@/features/notifications/actions'
import { getNotifications } from '@/features/notifications/queries'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'

export default async function NotificationsPage(){
  const [staff, data] = await Promise.all([getStaffAccessContext(), getNotifications()])

  if (!staff.userId) {
    redirect('/login?next=/notifications')
  }

  const unreadCount = data.notifications.filter((notification) => !notification.is_read).length
  const preferences = data.preferences ?? {
    event_updates_enabled: true,
    task_updates_enabled: true,
    blood_alerts_enabled: true,
    committee_updates_enabled: true,
    approval_updates_enabled: true,
    system_updates_enabled: true,
  }

  return (
    <main className="bg-uiussc-ivory py-12">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_22rem]">
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-green">Notifications</p>
              <h1 className="mt-2 text-3xl font-extrabold text-uiussc-navy">Notification Center</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">Stay updated on tasks, approvals, committee roles, and Blood Support work.</p>
            </div>
            {unreadCount > 0 && (
              <form action={markAllNotificationsReadAction}>
                <button type="submit" className="rounded-md bg-uiussc-navy px-4 py-2 text-sm font-extrabold text-white transition hover:bg-uiussc-green">
                  Mark all as read
                </button>
              </form>
            )}
          </div>

          {data.error && <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800" role="alert">Notifications are temporarily unavailable.</div>}

          <div className="mt-6 grid gap-3">
            {data.notifications.length === 0 ? (
              <EmptyState title="No notifications yet" description="New tasks, approvals, committee updates, and Blood Support alerts will appear here." />
            ) : data.notifications.map((notification) => (
              <article key={notification.id} className={`rounded-md border p-4 ${notification.is_read ? 'border-slate-200 bg-white' : 'border-uiussc-green/30 bg-emerald-50'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-uiussc-navy">{formatCategory(notification.category)}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${priorityClass(notification.priority)}`}>{formatPriority(notification.priority)}</span>
                      {!notification.is_read && <span className="rounded-full bg-uiussc-green px-3 py-1 text-xs font-extrabold text-white">Unread</span>}
                    </div>
                    <h2 className="mt-3 text-lg font-extrabold text-uiussc-navy">{notification.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p>
                    <p className="mt-2 text-xs font-bold text-slate-500">{formatDateTime(notification.created_at)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {notification.action_url && (
                      <Link href={notification.action_url} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-extrabold text-uiussc-navy transition hover:border-uiussc-green hover:text-uiussc-green">
                        Open
                      </Link>
                    )}
                    {!notification.is_read && (
                      <AdminActionForm action={markNotificationReadAction} id={notification.id} submitLabel="Mark read" />
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5 lg:self-start">
          <h2 className="text-xl font-extrabold text-uiussc-navy">Preferences</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Choose which in-app updates you want to receive.</p>
          <div className="mt-4">
            <AdminActionForm action={updateNotificationPreferencesAction} submitLabel="Save preferences" fields={
              <div className="grid gap-3">
                <PreferenceToggle name="eventUpdates" label="Event updates" defaultChecked={preferences.event_updates_enabled} />
                <PreferenceToggle name="taskUpdates" label="Task updates" defaultChecked={preferences.task_updates_enabled} />
                <PreferenceToggle name="bloodAlerts" label="Blood alerts" defaultChecked={preferences.blood_alerts_enabled} />
                <PreferenceToggle name="committeeUpdates" label="Committee updates" defaultChecked={preferences.committee_updates_enabled} />
                <PreferenceToggle name="approvalUpdates" label="Approval updates" defaultChecked={preferences.approval_updates_enabled} />
                <PreferenceToggle name="systemUpdates" label="System updates" defaultChecked={preferences.system_updates_enabled} />
              </div>
            } />
          </div>
        </aside>
      </div>
    </main>
  )
}

function PreferenceToggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }){
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3 text-sm font-bold text-slate-700">
      {label}
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="size-4 rounded border-slate-300 text-uiussc-green focus:ring-uiussc-green" />
    </label>
  )
}

function formatCategory(category: string){
  return category.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatPriority(priority: string){
  return priority.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function priorityClass(priority: string){
  if (priority === 'URGENT') return 'bg-red-100 text-red-800'
  if (priority === 'HIGH') return 'bg-amber-100 text-amber-800'
  return 'bg-slate-100 text-slate-700'
}

function formatDateTime(value: string){
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
