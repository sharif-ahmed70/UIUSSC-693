import Link from 'next/link'
import SafeImage from '@/components/media/SafeImage'
import { volunteerBenefits } from '@/features/home/content'
import type { PublicGalleryItem } from '@/features/gallery/types'

export default function VolunteerBenefits({ image }: { image: PublicGalleryItem | null }){
  return (
    <section className="landing-section bg-uiussc-ivory">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <SafeImage src={image?.imageUrl} alt={image?.caption || 'UIUSSC volunteers developing through service'} className="min-h-96 rounded-2xl" />
        <div>
          <p className="home-eyebrow">Why Volunteer With UIUSSC</p>
          <h2 className="font-display mt-4 text-4xl font-bold text-uiussc-charcoal md:text-5xl">Grow Through Service</h2>
          <p className="mt-5 text-lg leading-8 text-uiussc-muted">
            UIUSSC gives students opportunities to contribute to society while developing leadership, communication, teamwork, and practical event-management skills.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {volunteerBenefits.map((benefit) => (
              <article key={benefit.title} className="rounded-xl border border-[rgba(21,19,18,0.10)] bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-3 h-2 w-10 rounded-full bg-uiussc-orange" />
                <h3 className="font-extrabold text-uiussc-charcoal">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-6 text-uiussc-muted">{benefit.description}</p>
              </article>
            ))}
          </div>
          <Link href="/membership" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-md bg-uiussc-charcoal px-6 py-3 text-sm font-extrabold text-white transition hover:bg-uiussc-orange">
            Become a Member
          </Link>
        </div>
      </div>
    </section>
  )
}
