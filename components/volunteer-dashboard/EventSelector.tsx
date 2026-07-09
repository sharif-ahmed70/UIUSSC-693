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
  attendanceType,
}: {
  departmentId: string
  events: VolunteerDashboardEvent[]
  selectedEvent: VolunteerDashboardEvent | null
  module: string
  attendanceType: 'meeting' | 'booth'
}){
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div>
          <label htmlFor="attendanceEvent" className="text-sm font-extrabold text-uiussc-charcoal">Event</label>
          <select
            id="attendanceEvent"
            defaultValue={selectedEvent?.eventId ?? ''}
            className="mt-2 min-h-11 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20"
            onChange={(event) => {
              if(event.currentTarget.value){
                window.location.href = `/staff/volunteer/dashboard?module=${module}&attendanceType=${attendanceType}&eventId=${event.currentTarget.value}`
              }
            }}
          >
            <option value="">Select attendance event</option>
            {events.map((event) => (
              <option key={event.eventId} value={event.eventId ?? ''}>
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
          <input type="hidden" name="attendanceType" value={attendanceType} />
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

      <Link href="/staff/assigned-events" className="mt-4 inline-flex text-sm font-bold text-uiussc-orange hover:text-[#e85d00]">
        View all assigned events
      </Link>
    </section>
  )
}
