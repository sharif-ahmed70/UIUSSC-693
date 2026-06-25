import Link from 'next/link'
import SafeImage from '@/components/media/SafeImage'
import { formatEventDate } from '@/lib/date'
import type { PublicEvent } from '@/features/events/types'

export default function EventSpotlight({ event }: { event: PublicEvent | null }){
  return (
    <section className="landing-section bg-uiussc-charcoal text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <SafeImage src={event?.bannerUrl} alt={event ? event.title : 'UIUSSC upcoming program'} className="min-h-80 rounded-2xl" />
        <div>
          <p className="home-eyebrow">Next Upcoming</p>
          <h2 className="font-display mt-4 text-4xl font-bold leading-tight md:text-5xl">{event ? event.title : 'Programs Coming Soon'}</h2>
          {event ? (
            <>
              <p className="mt-5 text-lg leading-8 text-white/72">{event.summary}</p>
              <div className="mt-6 grid gap-3 text-sm font-semibold text-white/75 sm:grid-cols-2">
                <p>{formatEventDate(event.eventDate)}{event.startTime ? ` / ${event.startTime}` : ''}</p>
                <p>{event.location}</p>
                <p>{event.volunteerRequirements || 'General volunteers are welcome.'}</p>
                <p className={event.registrationOpen ? 'text-uiussc-positive' : 'text-white/60'}>{event.registrationOpen ? 'Registration Open' : 'Registration Closed'}</p>
              </div>
              <Link href={`/events/${event.slug}`} className="mt-8 inline-flex min-h-12 items-center justify-center rounded-md bg-uiussc-orange px-6 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#e85d00]">
                {event.registrationOpen ? 'Register for This Event' : 'View Event Details'}
              </Link>
            </>
          ) : (
            <>
              <p className="mt-5 text-lg leading-8 text-white/72">Published UIUSSC programs will appear here when the next event is ready.</p>
              <Link href="/events" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-md bg-uiussc-orange px-6 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#e85d00]">Explore Events</Link>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
