import Link from 'next/link'
import SafeImage from '@/components/media/SafeImage'
import type { PublicGalleryItem } from '@/features/gallery/types'

export default function ImpactGallery({ items }: { items: PublicGalleryItem[] }){
  if(items.length === 0){
    return null
  }

  const [feature, ...supporting] = items

  return (
    <section className="landing-section bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="home-eyebrow">Recent Impact Gallery</p>
            <h2 className="font-display mt-4 text-4xl font-bold text-uiussc-charcoal md:text-5xl">Moments of Impact</h2>
          </div>
          <Link href="/gallery" className="font-bold text-uiussc-charcoal underline decoration-uiussc-orange decoration-2 underline-offset-8 transition hover:text-uiussc-orange">Explore Full Gallery</Link>
        </div>
        <div className="mt-10 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="group overflow-hidden rounded-2xl border border-[rgba(21,19,18,0.10)] bg-white">
            <SafeImage src={feature.imageUrl} alt={feature.caption || feature.title} className="h-[28rem] w-full transition duration-500 group-hover:scale-105" />
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-uiussc-orange">{feature.category}</p>
              <h3 className="mt-2 text-xl font-extrabold text-uiussc-charcoal">{feature.title}</h3>
              <p className="mt-2 text-sm text-uiussc-muted">{feature.caption}</p>
            </div>
          </article>
          <div className="grid gap-4 sm:grid-cols-2">
            {supporting.slice(0, 4).map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-[rgba(21,19,18,0.10)] bg-white">
                <SafeImage src={item.imageUrl} alt={item.caption || item.title} className="h-44 w-full" />
                <div className="p-4">
                  <p className="text-xs font-bold text-uiussc-orange">{item.category}</p>
                  <h3 className="mt-1 font-bold text-uiussc-charcoal">{item.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
