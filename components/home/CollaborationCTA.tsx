import Link from 'next/link'
import SafeImage from '@/components/media/SafeImage'
import type { PublicGalleryItem } from '@/features/gallery/types'

export default function CollaborationCTA({ image }: { image: PublicGalleryItem | null }){
  return (
    <section className="bg-uiussc-charcoal text-white">
      <div className="mx-auto grid max-w-6xl gap-0 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1fr] lg:py-20">
        <SafeImage src={image?.imageUrl} alt={image?.caption || 'UIUSSC collaboration and community programs'} className="min-h-80 rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none" />
        <div className="rounded-b-2xl border border-white/10 bg-white/5 p-8 lg:rounded-r-2xl lg:rounded-bl-none">
          <p className="home-eyebrow">Let's Work Together</p>
          <h2 className="font-display mt-4 text-4xl font-bold leading-tight md:text-5xl">Let's Create Greater Impact Together</h2>
          <p className="mt-5 text-lg leading-8 text-white/72">
            We collaborate with university departments, hospitals, NGOs, alumni, sponsors, and community organizations to build meaningful and responsible social initiatives.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/contact" className="inline-flex min-h-12 items-center justify-center rounded-md bg-uiussc-orange px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#e85d00]">Collaborate With UIUSSC</Link>
            <Link href="/events" className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/20 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-white/10">Explore Our Work</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
