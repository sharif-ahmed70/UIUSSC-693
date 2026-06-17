export default function PageHeader({ title, subtitle }: { title: string; subtitle?: string }){
  return (
    <div className="mb-10 border-b border-slate-200 py-10">
      <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-uiussc-green">UIUSSC</p>
      <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-uiussc-navy md:text-5xl">{title}</h1>
      {subtitle && <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{subtitle}</p>}
    </div>
  )
}
