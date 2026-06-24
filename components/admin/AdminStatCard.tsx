type AdminStatCardProps = {
  label: string
  value: number
}

export default function AdminStatCard({ label, value }: AdminStatCardProps){
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-uiussc-charcoal">{value}</p>
    </div>
  )
}
