import Link from 'next/link'
import SafeImage from '@/components/media/SafeImage'
import { formatEventDate } from '@/lib/date'
import type { HomePageData } from '@/features/home/types'

export default function HeroSection({ data }: { data: HomePageData }){
  const event = data.nextEvent

  return (
    <section className="relative min-h-[760px] overflow-hidden bg-uiussc-charcoal text-white md:min-h-[720px]">
      <SafeImage src={data.heroImage?.imageUrl ?? event?.bannerUrl} alt="UIUSSC student volunteers serving communities" className="absolute inset-0 h-full w-full opacity-55" priority />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(21,19,18,0.92),rgba(22,27,42,0.78)_48%,rgba(21,19,18,0.42))]" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-24 pt-20 sm:px-6 md:grid-cols-[1.08fr_0.92fr] md:items-center md:pb-32 md:pt-28">
        <div>
          <p className="font-display text-xl italic text-white/80">Students Serving Communities</p>
          <p className="home-eyebrow mt-5">Student-Led Social Impact at UIU</p>
          <h1 className="font-display mt-5 max-w-4xl text-5xl font-bold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
            Together, We Turn Compassion Into <span className="text-uiussc-orange">Action.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
            UIUSSC connects students with meaningful volunteer opportunities, community-service programs, awareness initiatives, and humanitarian activities.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/membership" className="inline-flex min-h-12 items-center justify-center rounded-md bg-uiussc-orange px-6 py-3 text-sm font-extrabold text-white shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#e85d00]">
              Join as a Volunteer
            </Link>
            <Link href="/events" className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/25 px-6 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-white/10">
              Explore Our Events
            </Link>
            <Link href="/contact" className="inline-flex min-h-12 items-center justify-center text-sm font-bold text-white underline decoration-uiussc-orange decoration-2 underline-offset-8 transition hover:text-uiussc-orange">
              Partner With UIUSSC
            </Link>
          </div>
        </div>

        <div className="md:justify-self-end">
          <div className="home-card max-w-md bg-white p-5 text-uiussc-charcoal">
            {event ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-uiussc-orange/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-uiussc-orange">Upcoming Event</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${event.registrationOpen ? 'bg-uiussc-positive/10 text-uiussc-positive' : 'bg-uiussc-neutral text-uiussc-muted'}`}>
                    {event.registrationOpen ? 'Registration Open' : 'Registration Closed'}
                  </span>
                </div>
                <h2 className="font-display mt-5 text-3xl font-bold leading-tight">{event.title}</h2>
                <div className="mt-4 space-y-2 text-sm font-semibold text-uiussc-muted">
                  <p>{formatEventDate(event.eventDate)}{event.startTime ? ` / ${event.startTime}` : ''}</p>
                  <p>{event.location}</p>
                </div>
                <p className="mt-5 text-sm leading-6 text-uiussc-muted">{event.summary}</p>
                <Link href={`/events/${event.slug}`} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-uiussc-charcoal px-5 py-2.5 text-sm font-bold text-white transition hover:bg-uiussc-orange">
                  View Event Details
                </Link>
              </>
            ) : (
              <>
                <span className="rounded-full bg-uiussc-orange/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-uiussc-orange">UIUSSC Impact</span>
                <h2 className="font-display mt-5 text-3xl font-bold leading-tight">Programs Coming Soon</h2>
                <p className="mt-4 text-sm leading-6 text-uiussc-muted">Published UIUSSC activities will appear here when the next program is ready.</p>
                <Link href="/events" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-uiussc-charcoal px-5 py-2.5 text-sm font-bold text-white transition hover:bg-uiussc-orange">
                  Explore Events
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
