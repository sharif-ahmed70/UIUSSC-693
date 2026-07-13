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
          <h2 className="font-display max-w-2xl text-3xl font-bold leading-tight text-uiussc-charcoal md:text-4xl">Programs Creating Meaningful Change</h2>
          <Link href="/events" className="font-bold text-uiussc-charcoal underline decoration-uiussc-orange decoration-2 underline-offset-8 transition hover:text-uiussc-orange">View all events</Link>
        </div>
        {events.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {events.map((event) => (
              <article key={event.id} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[rgba(21,19,18,0.10)] bg-white shadow-sm transition hover:-translate-y-1 hover:border-uiussc-orange/40 hover:shadow-xl">
                <div className="relative overflow-hidden">
                  <SafeImage src={event.bannerUrl} alt={event.title} className="h-44 w-full transition duration-500 group-hover:scale-105" />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-uiussc-orange shadow-sm">{event.category}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold shadow-sm ${event.registrationOpen ? 'bg-uiussc-positive text-white' : 'bg-uiussc-neutral text-uiussc-muted'}`}>{event.registrationOpen ? 'Open' : 'Closed'}</span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-base font-extrabold leading-snug text-uiussc-charcoal">{event.title}</h3>
                  <div className="mt-3 space-y-2 text-sm font-semibold text-uiussc-muted">
                    <p>{formatEventDate(event.eventDate)}</p>
                    <p>{event.location}</p>
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-6 text-uiussc-muted">{event.summary}</p>
                  <Link href={`/events/${event.slug}`} className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-[rgba(21,19,18,0.12)] px-4 py-2 text-sm font-extrabold text-uiussc-charcoal transition hover:border-uiussc-orange hover:text-uiussc-orange">View Details</Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-[rgba(21,19,18,0.18)] bg-uiussc-ivory p-8 text-center">
            <h3 className="text-xl font-extrabold text-uiussc-charcoal">Published programs will appear here soon.</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-uiussc-muted">Once UIUSSC publishes upcoming events, this section will automatically highlight them.</p>
          </div>
        )}
      </div>
    </section>
  )
}
