import Link from 'next/link'
import { serviceAreas } from '@/features/home/content'

export default function ServiceAreas({ categoryCounts }: { categoryCounts: Record<string, number> }){
  return (
    <section className="landing-section bg-uiussc-neutral">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="home-eyebrow">Service Focus</p>
        <h2 className="font-display mt-4 text-4xl font-bold text-uiussc-charcoal md:text-5xl">Our Areas of Service</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {serviceAreas.map((area) => {
            const count = area.category ? categoryCounts[area.category] : undefined
            return (
              <Link key={area.title} href="/events" className="group rounded-2xl border border-[rgba(21,19,18,0.10)] bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-uiussc-orange/10 text-uiussc-orange">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none"><path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </div>
                <h3 className="text-xl font-extrabold text-uiussc-charcoal">{area.title}</h3>
                <p className="mt-3 text-sm leading-6 text-uiussc-muted">{area.description}</p>
                <p className="mt-5 text-sm font-bold text-uiussc-orange">{typeof count === 'number' ? `${count} published program${count === 1 ? '' : 's'}` : 'Programs developing'}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
