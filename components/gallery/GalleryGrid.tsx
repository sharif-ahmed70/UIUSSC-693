'use client'

import { useMemo, useState } from 'react'
import type { PublicGalleryItem } from '@/features/gallery/types'

const categories = ['All', 'Blood Donation', 'Donation Drive', 'Orientation', 'Campaign']

function safeImageUrl(value: string){
  if(value.startsWith('/')) return value

  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? value : null
  } catch {
    return null
  }
}

function GalleryVisual({ item, index }: { item: PublicGalleryItem; index: number }){
  const [imageFailed, setImageFailed] = useState(false)
  const imageUrl = safeImageUrl(item.imageUrl)

  if(imageUrl && !imageFailed){
    return (
      <div className="h-48 bg-slate-100">
        <img src={imageUrl} alt={item.caption || item.title} className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
      </div>
    )
  }

  return (
    <div className={`h-48 bg-gradient-to-br ${index % 2 === 0 ? 'from-uiussc-navy via-[#123b67] to-uiussc-green' : 'from-slate-200 via-emerald-100 to-slate-100'} p-4`}>
      <div className="flex h-full items-end rounded-md border border-white/40 bg-white/10 p-4 backdrop-blur-sm">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-uiussc-navy">{item.category}</span>
      </div>
    </div>
  )
}

export default function GalleryGrid({ items }: { items: PublicGalleryItem[] }){
  const [filter, setFilter] = useState('All')
  const filteredItems = useMemo(() => {
    return filter === 'All' ? items : items.filter((item) => item.category === filter)
  }, [filter, items])

  return (
    <>
      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              aria-pressed={filter === category}
              className={`rounded-full px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-green/20 ${filter === category ? 'bg-uiussc-navy text-white' : 'bg-uiussc-light text-slate-600 hover:bg-emerald-50 hover:text-uiussc-navy'}`}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {filteredItems.map((item, index) => (
          <article key={item.id} className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
            <GalleryVisual item={item} index={index} />
            <div className="p-5">
              <h3 className="font-bold text-uiussc-navy">{item.caption || item.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{item.category}</p>
            </div>
          </article>
        ))}
      </section>
    </>
  )
}
