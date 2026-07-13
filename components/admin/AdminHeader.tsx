type AdminHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
}

export default function AdminHeader({ eyebrow = 'UIUSSC Admin', title, description }: AdminHeaderProps){
  return (
    <header className="mb-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-orange">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-extrabold text-uiussc-charcoal">{title}</h1>
      {description && <p className="mt-3 max-w-3xl leading-7 text-slate-600">{description}</p>}
    </header>
  )
}
