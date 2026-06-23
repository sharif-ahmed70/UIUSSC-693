import Link from 'next/link'
import { getInvolvedOptions } from '@/features/home/content'

export default function GetInvolvedSection(){
  return (
    <section className="landing-section bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="home-eyebrow">Ways to Get Involved</p>
        <h2 className="font-display mt-4 text-4xl font-bold text-uiussc-charcoal md:text-5xl">Choose Your Next Step</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {getInvolvedOptions.map((option, index) => (
            <article key={option.title} className="home-card p-6 transition hover:-translate-y-1">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-uiussc-orange text-lg font-black text-white">0{index + 1}</div>
              <h3 className="text-2xl font-extrabold text-uiussc-charcoal">{option.title}</h3>
              <p className="mt-3 text-sm leading-6 text-uiussc-muted">{option.description}</p>
              <Link href={option.href} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-uiussc-charcoal px-5 py-2.5 text-sm font-bold text-white transition hover:bg-uiussc-orange">
                {option.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
