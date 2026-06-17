import Link from 'next/link'
import Container from '@/components/Container'
import Button from '@/components/Button'
import { events } from '@/data/events'
import { formatEventDate } from '@/lib/date'
import { notFound } from 'next/navigation'

export default async function EventDetail({ params }: { params: Promise<{ slug: string }> }){
  const { slug } = await params
  const event = events.find((item) => item.slug === slug)
  if(!event) return notFound()

  const isOpen = event.status === 'Open'

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
                {event.status}
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
                <p className="mt-3 leading-7 text-slate-600">{event.requirements || 'General volunteers are welcome. Members should be punctual, responsible, and ready to support coordination tasks.'}</p>
              </section>
            </div>

            <aside className="h-fit rounded-lg border border-slate-200 bg-uiussc-light p-6">
              <h2 className="text-lg font-bold text-uiussc-navy">Event Information</h2>
              <div className="mt-5 space-y-4 text-sm">
                <div>
                  <p className="font-bold text-slate-500">Date</p>
                  <p className="mt-1 text-uiussc-navy">{formatEventDate(event.date)}</p>
                </div>
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
                  <p className="mt-1 text-uiussc-navy">{event.status}</p>
                </div>
              </div>
              <div className="mt-6">
                <Button type="button" variant="secondary">Register Interest</Button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </Container>
  )
}
