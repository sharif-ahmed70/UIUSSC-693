import Container from '@/components/Container'
import Button from '@/components/Button'
import ImpactCounter from '@/components/ImpactCounter'
import EventCard from '@/components/EventCard'
import SectionHeader from '@/components/SectionHeader'
import { events } from '@/data/events'
import { recentActivities, whyJoin } from '@/data/home'
import { formatEventDate } from '@/lib/date'

export default function Home(){
  const upcoming = events.slice(0, 3)
  const featuredEvent = events.find((event) => event.status === 'Open') ?? events[0]

  return (
    <>
      <section className="relative overflow-hidden bg-uiussc-navy text-white">
        <div className="subtle-grid">
          <Container>
            <div className="grid gap-8 py-12 md:min-h-[590px] md:grid-cols-[1.04fr_0.96fr] md:items-center md:gap-10 md:py-14 lg:min-h-[620px]">
              <div className="max-w-3xl">
                <p className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-100">
                  United International University Social Services Club
                </p>
                <h1 className="max-w-3xl text-balance text-4xl font-extrabold leading-[1.08] tracking-tight md:text-5xl lg:text-[3.35rem]">
                  United International University Social Services Club
                </h1>
                <p className="mt-4 text-xl font-semibold text-emerald-200 md:text-2xl">Serving Humanity, Building Community</p>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 md:text-lg md:leading-8">
                  A student-led platform dedicated to volunteering, awareness campaigns, donation drives, and meaningful social impact.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Button href="/membership" variant="secondary">Join UIUSSC</Button>
                  <Button href="/events" variant="ghost">Explore Events</Button>
                </div>
              </div>

              <div className="self-center rounded-xl border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur sm:p-4">
                <div className="rounded-lg bg-white p-5 text-uiussc-navy">
                  <div className="h-56 rounded-lg bg-gradient-to-br from-slate-100 via-emerald-50 to-slate-200 p-5">
                    <div className="flex h-full flex-col justify-between rounded-md border border-white/80 bg-white/70 p-5 shadow-sm">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-green">Upcoming Event</p>
                        <h2 className="mt-3 text-2xl font-extrabold">{featuredEvent.title}</h2>
                        <p className="mt-3 text-sm font-semibold text-slate-600">{formatEventDate(featuredEvent.date)} at {featuredEvent.location}</p>
                      </div>
                      <p className="text-sm leading-6 text-slate-600">{featuredEvent.description}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-md bg-uiussc-light p-3">
                      <div className="text-xl font-extrabold">500+</div>
                      <div className="text-xs font-semibold text-slate-500">Volunteers</div>
                    </div>
                    <div className="rounded-md bg-uiussc-light p-3">
                      <div className="text-xl font-extrabold">50+</div>
                      <div className="text-xs font-semibold text-slate-500">Events</div>
                    </div>
                    <div className="rounded-md bg-uiussc-light p-3">
                      <div className="text-xl font-extrabold">20+</div>
                      <div className="text-xs font-semibold text-slate-500">Drives</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </section>

      <Container>
        <section className="py-14">
          <ImpactCounter />
        </section>

        <section className="py-10">
          <SectionHeader title="Upcoming Events" subtitle="Join structured service opportunities led by UIUSSC volunteers." />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {upcoming.map((event) => <EventCard key={event.slug} event={event} />)}
          </div>
        </section>

        <section className="py-10">
          <SectionHeader title="Recent Activities" subtitle="A snapshot of the work UIUSSC members support across campus and community programs." />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {recentActivities.map((activity) => (
              <article key={activity.title} className="premium-card p-6">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">{activity.category}</span>
                <h3 className="mt-5 text-xl font-bold text-uiussc-navy">{activity.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{activity.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-10">
          <SectionHeader title="Why Join UIUSSC" subtitle="Membership is a practical way to grow as a student while contributing to meaningful causes." />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {whyJoin.map((item, index) => (
              <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-uiussc-navy text-sm font-extrabold text-white">0{index + 1}</div>
                <h3 className="mt-5 text-lg font-bold text-uiussc-navy">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="my-10 overflow-hidden rounded-xl bg-uiussc-navy text-white shadow-2xl">
          <div className="subtle-grid px-6 py-10 text-center md:px-12">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-200">Ready to serve?</p>
            <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-extrabold md:text-4xl">Be part of a club that turns student energy into social impact.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-200">Join UIUSSC to volunteer, organize, learn, and contribute to community-centered initiatives.</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href="/membership" variant="secondary">Join Now</Button>
              <Button href="/contact" variant="ghost">Contact Us</Button>
            </div>
          </div>
        </section>
      </Container>
    </>
  )
}
