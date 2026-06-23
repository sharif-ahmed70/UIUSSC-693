import Link from 'next/link'
import Container from '@/components/Container'

export default function EventNotFound(){
  return (
    <Container>
      <section className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-uiussc-green">Event Not Found</p>
        <h1 className="mt-3 text-3xl font-extrabold text-uiussc-navy">This event is not available</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          The event may have been removed, archived, or not published yet.
        </p>
        <Link href="/events" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-uiussc-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#071a33] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-green/20">
          Back to events
        </Link>
      </section>
    </Container>
  )
}
