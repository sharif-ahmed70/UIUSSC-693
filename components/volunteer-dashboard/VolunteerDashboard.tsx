import AttendanceTable from './AttendanceTable'
import BloodOverview from './BloodOverview'
import CommitteeOverview from './CommitteeOverview'
import EventPreview from './EventPreview'
import EventSelector from './EventSelector'
import MetricsCards from './MetricsCards'
import NotificationPanel from './NotificationPanel'
import TaskSnapshot from './TaskSnapshot'
import VolunteerSidebar from './VolunteerSidebar'
import type { VolunteerDashboardData, VolunteerDashboardModule } from '@/features/volunteer-dashboard/types'

export default function VolunteerDashboard({
  data,
  activeModule,
}: {
  data: VolunteerDashboardData
  activeModule: VolunteerDashboardModule
}){
  const selectedEventId = data.selectedEvent?.attendanceEventId ?? null
  const counts = {
    attendance: data.members.filter((member) => member.attendanceStatus === 'unmarked').length,
    tasks: data.tasks.filter((task) => !['completed', 'cancelled'].includes(task.status)).length,
    events: data.events.length,
    committee: data.committeeMembers.length,
    blood: data.bloodAssignments.length,
    notifications: data.notifications.length,
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
      <VolunteerSidebar activeModule={activeModule} eventId={selectedEventId} counts={counts} />
      <main className="min-w-0 space-y-5">
        <section className="rounded-md bg-uiussc-charcoal p-6 text-white shadow-xl shadow-slate-900/10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-orange">Volunteer Department</p>
          <h1 className="mt-3 text-3xl font-extrabold">{data.department.name} Dashboard</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Attendance, tasks, participation, committee context, blood assignments, and alerts in one department workspace.</p>
        </section>

        <EventSelector departmentId={data.department.id} events={data.events} selectedEvent={data.selectedEvent} module={activeModule} />
        <MetricsCards metrics={data.metrics} />

        {activeModule === 'attendance' && <AttendanceTable attendanceEventId={selectedEventId} members={data.members} canManage={data.canManageAttendance} />}
        {activeModule === 'tasks' && <TaskSnapshot tasks={data.tasks} />}
        {activeModule === 'events' && <EventPreview events={data.events} />}
        {activeModule === 'committee' && <CommitteeOverview members={data.committeeMembers} />}
        {activeModule === 'blood' && <BloodOverview assignments={data.bloodAssignments} />}
        {activeModule === 'notifications' && <NotificationPanel notifications={data.notifications} />}
      </main>
    </div>
  )
}
