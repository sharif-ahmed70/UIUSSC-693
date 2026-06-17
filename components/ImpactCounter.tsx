import { impact } from '@/data/impact'

export default function ImpactCounter(){
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {impact.map((i) => (
        <div key={i.id} className="premium-card p-5 text-center transition duration-200 hover:-translate-y-1 hover:shadow-xl">
          <div className="text-3xl font-extrabold text-uiussc-navy md:text-4xl">{i.value}</div>
          <div className="mt-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{i.label}</div>
        </div>
      ))}
    </div>
  )
}
