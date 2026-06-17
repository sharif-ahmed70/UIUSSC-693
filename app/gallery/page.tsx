"use client"
import Container from '@/components/Container'
import PageHeader from '@/components/PageHeader'
import { gallery } from '@/data/gallery'
import { useState } from 'react'

const categories = ['All', 'Blood Donation', 'Donation Drive', 'Orientation', 'Campaign']

export default function Gallery(){
  const [filter, setFilter] = useState('All')
  const items = filter === 'All' ? gallery : gallery.filter((item) => item.category === filter)

  return (
    <Container>
      <PageHeader
        title="Gallery"
        subtitle="A visual archive of UIUSSC events, campaigns, orientations, and volunteer activities."
      />

      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${filter === category ? 'bg-uiussc-navy text-white' : 'bg-uiussc-light text-slate-600 hover:bg-emerald-50 hover:text-uiussc-navy'}`}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => (
          <article key={item.id} className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
            <div className={`h-48 bg-gradient-to-br ${index % 2 === 0 ? 'from-uiussc-navy via-[#123b67] to-uiussc-green' : 'from-slate-200 via-emerald-100 to-slate-100'} p-4`}>
              <div className="flex h-full items-end rounded-md border border-white/40 bg-white/10 p-4 backdrop-blur-sm">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-uiussc-navy">{item.category}</span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-uiussc-navy">{item.caption}</h3>
              <p className="mt-2 text-sm text-slate-500">UIUSSC activity documentation</p>
            </div>
          </article>
        ))}
      </section>
    </Container>
  )
}
