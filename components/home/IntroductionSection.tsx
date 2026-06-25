import Link from 'next/link'
import SafeImage from '@/components/media/SafeImage'
import { introValues } from '@/features/home/content'
import type { PublicGalleryItem } from '@/features/gallery/types'

export default function IntroductionSection({ image }: { image: PublicGalleryItem | null }){
  return (
    <section className="landing-section">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="home-eyebrow">Who We Are</p>
          <h2 className="font-display mt-4 text-4xl font-bold leading-tight text-uiussc-charcoal md:text-5xl">Students Serving Communities With Purpose</h2>
          <p className="mt-5 text-lg leading-8 text-uiussc-muted">
            United International University Social Services Club is a student-led platform dedicated to social welfare, humanitarian service, awareness programs, community development, and responsible volunteerism.
          </p>
          <Link href="/about" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-md bg-uiussc-charcoal px-6 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-uiussc-orange">
            Discover UIUSSC
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_0.9fr]">
          <SafeImage src={image?.imageUrl} alt={image?.caption || 'UIUSSC volunteers working together'} className="min-h-80 rounded-2xl" />
          <div className="grid gap-3">
            {introValues.map((value) => (
              <article key={value.title} className="rounded-xl border border-[rgba(21,19,18,0.10)] bg-white p-4">
                <div className="mb-3 h-2 w-10 rounded-full bg-uiussc-orange" />
                <h3 className="font-bold text-uiussc-charcoal">{value.title}</h3>
                <p className="mt-1 text-sm leading-6 text-uiussc-muted">{value.description}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
