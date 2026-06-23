import Link from 'next/link'
import SafeImage from '@/components/media/SafeImage'
import { formatEventDate } from '@/lib/date'
import type { PublicEvent } from '@/features/events/types'

export default function FeaturedInitiatives({ events }: { events: PublicEvent[] }){
  return (
    <section className="landing-section bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="home-eyebrow">Our Popular Initiatives</p>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="font-display max-w-2xl text-4xl font-bold leading-tight text-uiussc-charcoal md:text-5xl">Programs Creating Meaningful Change</h2>
          <Link href="/events" className="font-bold text-uiussc-charcoal underline decoration-uiussc-orange decoration-2 underline-offset-8 transition hover:text-uiussc-orange">View all events</Link>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {events.map((event) => (
            <article key={event.id} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[rgba(21,19,18,0.10)] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="overflow-hidden">
                <SafeImage src={event.bannerUrl} alt={event.title} className="h-52 w-full transition duration-500 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-uiussc-orange/10 px-3 py-1 text-xs font-bold text-uiussc-orange">{event.category}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${event.registrationOpen ? 'bg-uiussc-positive/10 text-uiussc-positive' : 'bg-uiussc-neutral text-uiussc-muted'}`}>{event.registrationOpen ? 'Open' : 'Closed'}</span>
                </div>
                <h3 className="mt-4 text-lg font-extrabold leading-snug text-uiussc-charcoal">{event.title}</h3>
                <p className="mt-2 text-sm font-semibold text-uiussc-muted">{formatEventDate(event.eventDate)} / {event.location}</p>
                <p className="mt-3 flex-1 text-sm leading-6 text-uiussc-muted">{event.summary}</p>
                <Link href={`/events/${event.slug}`} className="mt-5 text-sm font-extrabold text-uiussc-charcoal transition hover:text-uiussc-orange">View Details</Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
