import Link from 'next/link'
import type { Metadata } from 'next'
import Container from '@/components/Container'
import EventRegistrationForm from '@/components/forms/EventRegistrationForm'
import { formatEventDate } from '@/lib/date'
import { notFound } from 'next/navigation'
import ContentUnavailable from '@/components/states/ContentUnavailable'
import { getPublishedEventBySlug, normalizeEventSlug } from '@/features/events/queries/getPublishedEventBySlug'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const result = await getPublishedEventBySlug(slug)

  if(!result.data){
    return {
      title: 'Event Not Found | UIUSSC',
      description: 'The requested UIUSSC event could not be found.',
    }
  }

  return {
    title: `${result.data.title} | UIUSSC`,
    description: result.data.summary,
  }
}

export default async function EventDetail({ params }: { params: Promise<{ slug: string }> }){
  const { slug } = await params
  if(!normalizeEventSlug(slug)) return notFound()

  const result = await getPublishedEventBySlug(slug)
  if(result.error) {
    return (
      <Container>
        <ContentUnavailable title="Event details are temporarily unavailable" description="Please refresh the page or return to the events list." />
      </Container>
    )
  }
  if(!result.data) return notFound()

  const event = result.data
  const isOpen = event.registrationOpen

  return (
    <Container>
      <section className="py-10">
        <Link href="/events" className="text-sm font-bold text-uiussc-navy transition hover:text-uiussc-green">
          Back to events
        </Link>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="bg-gradient-to-br from-uiussc-navy via-[#123b67] to-uiussc-green px-6 py-16 text-white md:px-10">
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">{event.category}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                {isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">{event.title}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-200">{event.description}</p>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-[1fr_360px] md:p-8">
            <div className="space-y-6">
              <section className="premium-card p-6">
                <h2 className="text-xl font-bold text-uiussc-navy">Event Overview</h2>
                <p className="mt-3 leading-7 text-slate-600">
                  This UIUSSC program is organized to connect students with structured volunteer opportunities and practical community service work.
                </p>
              </section>

              <section className="premium-card p-6">
                <h2 className="text-xl font-bold text-uiussc-navy">Volunteer Requirements</h2>
                <p className="mt-3 leading-7 text-slate-600">{event.volunteerRequirements || 'General volunteers are welcome. Members should be punctual, responsible, and ready to support coordination tasks.'}</p>
              </section>
            </div>

            <aside className="h-fit rounded-lg border border-slate-200 bg-uiussc-light p-6">
              <h2 className="text-lg font-bold text-uiussc-navy">Event Information</h2>
              <div className="mt-5 space-y-4 text-sm">
                <div>
                  <p className="font-bold text-slate-500">Date</p>
                  <p className="mt-1 text-uiussc-navy">{formatEventDate(event.eventDate)}</p>
                </div>
                {(event.startTime || event.endTime) && (
                  <div>
                    <p className="font-bold text-slate-500">Time</p>
                    <p className="mt-1 text-uiussc-navy">{[event.startTime, event.endTime].filter(Boolean).join(' - ')}</p>
                  </div>
                )}
                <div>
                  <p className="font-bold text-slate-500">Location</p>
                  <p className="mt-1 text-uiussc-navy">{event.location}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-500">Category</p>
                  <p className="mt-1 text-uiussc-navy">{event.category}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-500">Status</p>
                  <p className="mt-1 text-uiussc-navy">{isOpen ? 'Open' : 'Closed'}</p>
                </div>
                {event.capacity && (
                  <div>
                    <p className="font-bold text-slate-500">Capacity</p>
                    <p className="mt-1 text-uiussc-navy">{event.capacity} participants</p>
                  </div>
                )}
              </div>
              {isOpen ? (
                <EventRegistrationForm eventSlug={event.slug} eventTitle={event.title} />
              ) : (
                <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Registration Closed</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Registration for this event is currently closed. Please explore other open UIUSSC events.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </Container>
  )
}
