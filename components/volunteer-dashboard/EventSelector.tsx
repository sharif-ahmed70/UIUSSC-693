'use client'

import Link from 'next/link'
import { createVolunteerAttendanceEventAction } from '@/features/volunteer-dashboard/actions'
import type { VolunteerDashboardEvent } from '@/features/volunteer-dashboard/types'
import { formatEventDate } from '@/lib/date'

export default function EventSelector({
  departmentId,
  events,
  selectedEvent,
  module,
}: {
  departmentId: string
  events: VolunteerDashboardEvent[]
  selectedEvent: VolunteerDashboardEvent | null
  module: string
}){
  const attendanceEvents = events.filter((event) => event.attendanceEventId)
  const assignedEvents = events.filter((event) => !event.attendanceEventId && event.eventId)

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div>
          <label htmlFor="attendanceEvent" className="text-sm font-extrabold text-uiussc-charcoal">Event</label>
          <select
            id="attendanceEvent"
            defaultValue={selectedEvent?.attendanceEventId ?? ''}
            className="mt-2 min-h-11 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20"
            onChange={(event) => {
              if(event.currentTarget.value){
                window.location.href = `/staff/volunteer/dashboard?module=${module}&eventId=${event.currentTarget.value}`
              }
            }}
          >
            <option value="">Select attendance event</option>
            {attendanceEvents.map((event) => (
              <option key={event.attendanceEventId} value={event.attendanceEventId ?? ''}>
                {event.title} - {formatEventDate(event.eventDate)}
              </option>
            ))}
          </select>
          {selectedEvent && (
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Selected: {selectedEvent.title} / {selectedEvent.location ?? 'Location not set'}
            </p>
          )}
        </div>

        <form action={createVolunteerAttendanceEventAction} className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input type="hidden" name="departmentId" value={departmentId} />
          <input type="hidden" name="eventKind" value="meeting" />
          <div>
            <label htmlFor="missingEventTitle" className="text-sm font-extrabold text-uiussc-charcoal">Missing event or meeting</label>
            <input
              id="missingEventTitle"
              name="title"
              placeholder="Example: Volunteer briefing"
              className="mt-2 min-h-11 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20"
            />
            <input name="eventDate" type="date" className="mt-2 min-h-11 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
          </div>
          <button type="submit" className="self-end rounded-md bg-uiussc-orange px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#e85d00] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
            Save
          </button>
        </form>
      </div>

      {assignedEvents.length > 0 && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Assigned events not yet opened for attendance</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {assignedEvents.slice(0, 4).map((event) => (
              <form key={`${event.eventId}-${event.departmentId}`} action={createVolunteerAttendanceEventAction} className="rounded-md border border-slate-200 p-3">
                <input type="hidden" name="departmentId" value={event.departmentId} />
                <input type="hidden" name="sourceEventId" value={event.eventId ?? ''} />
                <input type="hidden" name="title" value={event.title} />
                <input type="hidden" name="eventDate" value={event.eventDate} />
                <input type="hidden" name="eventKind" value="event" />
                <input type="hidden" name="location" value={event.location ?? ''} />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-uiussc-charcoal">{event.title}</p>
                    <p className="text-xs text-slate-500">{formatEventDate(event.eventDate)}</p>
                  </div>
                  <button type="submit" className="rounded-md border border-slate-200 px-3 py-2 text-xs font-extrabold text-uiussc-charcoal transition hover:border-uiussc-orange hover:text-uiussc-orange">
                    Start
                  </button>
                </div>
              </form>
            ))}
          </div>
        </div>
      )}

      <Link href="/staff/assigned-events" className="mt-4 inline-flex text-sm font-bold text-uiussc-orange hover:text-[#e85d00]">
        View all assigned events
      </Link>
    </section>
  )
}
