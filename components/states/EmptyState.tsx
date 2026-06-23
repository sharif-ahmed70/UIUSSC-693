export default function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}){
  return (
    <section className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
      <h2 className="text-xl font-bold text-uiussc-navy">{title}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
    </section>
  )
}
