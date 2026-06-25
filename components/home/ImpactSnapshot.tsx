import type { ImpactMetric } from '@/features/home/types'

export default function ImpactSnapshot({ metrics }: { metrics: ImpactMetric[] }){
  return (
    <section className="relative z-10 mx-auto -mt-16 max-w-6xl px-4 sm:px-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="home-card min-h-36 p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-uiussc-orange/10 text-uiussc-orange" aria-hidden="true">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </div>
            <div className="text-3xl font-black text-uiussc-charcoal">{metric.value}</div>
            <h2 className="mt-1 text-sm font-extrabold text-uiussc-charcoal">{metric.label}</h2>
            <p className="mt-2 text-xs leading-5 text-uiussc-muted">{metric.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
