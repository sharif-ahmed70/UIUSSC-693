'use client'

import { useMemo, useState } from 'react'
import EventCard from '@/components/EventCard'
import { eventFilters, type EventFilter } from '@/data/eventFilters'
import type { Event } from '@/types'

export default function EventList({ events }: { events: Event[] }){
  const [activeFilter, setActiveFilter] = useState<EventFilter>('All Events')

  const filteredEvents = useMemo(() => {
    if(activeFilter === 'All Events') return events
    return events.filter((event) => event.category === activeFilter)
  }, [activeFilter, events])

  return (
    <>
      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {eventFilters.map((filter) => {
            const isActive = activeFilter === filter

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                aria-pressed={isActive}
                className={`min-h-11 rounded-full px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-green/20 ${
                  isActive
                    ? 'bg-uiussc-navy text-white'
                    : 'bg-uiussc-light text-slate-600 hover:bg-emerald-50 hover:text-uiussc-navy'
                }`}
              >
                {filter}
              </button>
            )
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => <EventCard key={event.slug} event={event} />)}
      </section>
    </>
  )
}
