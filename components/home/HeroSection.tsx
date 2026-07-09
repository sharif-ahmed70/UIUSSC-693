import Link from 'next/link'
import SafeImage from '@/components/media/SafeImage'
import HeroBackdropCarousel from '@/components/home/HeroBackdropCarousel'
import { formatEventDate } from '@/lib/date'
import type { HomePageData } from '@/features/home/types'

function uniqueHeroImages(data: HomePageData){
  const images = [
    data.heroImage?.imageUrl,
    data.nextEvent?.bannerUrl,
    data.introImage?.imageUrl,
    data.volunteerImage?.imageUrl,
    ...data.galleryItems.map((item) => item.imageUrl),
  ].filter((image): image is string => Boolean(image))

  return [...new Set(images)].slice(0, 5)
}

export default function HeroSection({ data }: { data: HomePageData }){
  const event = data.nextEvent
  const heroImages = uniqueHeroImages(data)
  const primaryMetric = data.impactMetrics[0]
  const secondaryMetric = data.impactMetrics[1]

  return (
    <section className="relative min-h-[620px] overflow-hidden bg-uiussc-charcoal text-white md:min-h-[640px]">
      <HeroBackdropCarousel images={heroImages} />
      <div className="absolute inset-0 subtle-grid opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,rgba(47,168,79,0.22),transparent_22rem),linear-gradient(90deg,rgba(21,19,18,0.94),rgba(22,27,42,0.82)_48%,rgba(21,19,18,0.46))]" />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:items-center md:pb-20 md:pt-18">
        <div>
          {data.announcement && (
            <Link href="/notices" className="mb-4 inline-flex max-w-full items-center gap-3 rounded-full border border-white/16 bg-white/10 px-4 py-2 text-sm font-bold text-white/86 backdrop-blur transition hover:bg-white/16">
              <span className="h-2 w-2 rounded-full bg-uiussc-orange" aria-hidden="true" />
              <span className="truncate">{data.announcement.title}</span>
            </Link>
          )}
          <p className="font-display text-lg italic text-white/80">Serving Humanity, Building Community</p>
          <p className="home-eyebrow mt-4">Student-Led Social Impact at UIU</p>
          <h1 className="font-display mt-4 max-w-3xl text-4xl font-bold leading-[1.06] tracking-tight text-balance sm:text-5xl lg:text-[3.65rem]">
            United International University <span className="text-uiussc-orange">Social Services Club.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/78">
            UIUSSC connects students with meaningful volunteer opportunities, community-service programs, awareness initiatives, donation drives, and humanitarian activities.
          </p>
          <div className="mt-5 grid max-w-lg grid-cols-2 gap-3">
            {[primaryMetric, secondaryMetric].filter(Boolean).map((metric) => (
              <div key={metric.label} className="rounded-lg border border-white/12 bg-white/10 p-3 backdrop-blur">
                <p className="text-xl font-black text-white">{metric.value}+</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-white/64">{metric.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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
          <div className="home-card max-w-sm overflow-hidden bg-white text-uiussc-charcoal md:max-w-md">
            {event ? (
              <>
                <div className="relative h-40 overflow-hidden">
                  <SafeImage src={event.bannerUrl ?? data.heroImage?.imageUrl} alt={event.title} className="h-full w-full transition duration-500 hover:scale-105" />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-uiussc-orange">Upcoming Event</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${event.registrationOpen ? 'bg-uiussc-positive text-white' : 'bg-uiussc-neutral text-uiussc-muted'}`}>
                      {event.registrationOpen ? 'Registration Open' : 'Registration Closed'}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h2 className="font-display text-2xl font-bold leading-tight">{event.title}</h2>
                  <div className="mt-3 space-y-2 text-sm font-semibold text-uiussc-muted">
                    <p>{formatEventDate(event.eventDate)}{event.startTime ? ` / ${event.startTime}` : ''}</p>
                    <p>{event.location}</p>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-uiussc-muted">{event.summary}</p>
                  <Link href={`/events/${event.slug}`} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-uiussc-charcoal px-5 py-2.5 text-sm font-bold text-white transition hover:bg-uiussc-orange">
                    View Event Details
                  </Link>
                </div>
              </>
            ) : (
              <div className="p-5">
                <span className="rounded-full bg-uiussc-orange/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-uiussc-orange">UIUSSC Impact</span>
                <h2 className="font-display mt-5 text-2xl font-bold leading-tight">Programs Coming Soon</h2>
                <p className="mt-4 text-sm leading-6 text-uiussc-muted">Published UIUSSC activities will appear here when the next program is ready.</p>
                <Link href="/events" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-uiussc-charcoal px-5 py-2.5 text-sm font-bold text-white transition hover:bg-uiussc-orange">
                  Explore Events
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
