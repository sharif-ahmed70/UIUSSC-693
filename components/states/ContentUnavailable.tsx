export default function ContentUnavailable({
  title = 'Content is temporarily unavailable',
  description = 'Please refresh the page or check back shortly.',
}: {
  title?: string
  description?: string
}){
  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
      <h2 className="text-xl font-bold text-uiussc-navy">{title}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-amber-900">{description}</p>
    </section>
  )
}
