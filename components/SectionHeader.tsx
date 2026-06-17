export default function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }){
  return (
    <header className="mb-7 max-w-3xl">
      <div className="mb-3 h-1 w-12 rounded-full bg-uiussc-green" />
      <h2 className="text-2xl font-bold tracking-tight text-uiussc-navy md:text-3xl">{title}</h2>
      {subtitle && <p className="mt-3 text-base leading-7 text-slate-600">{subtitle}</p>}
    </header>
  )
}
