type StatusBadgeProps = {
  status: string | null | undefined
}

const tones: Record<string, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  requested: 'border-amber-200 bg-amber-50 text-amber-800',
  under_review: 'border-blue-200 bg-blue-50 text-blue-800',
  waitlisted: 'border-blue-200 bg-blue-50 text-blue-800',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  active: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  rejected: 'border-red-200 bg-red-50 text-red-800',
  suspended: 'border-orange-200 bg-orange-50 text-orange-800',
  archived: 'border-slate-200 bg-slate-100 text-slate-700',
  inactive: 'border-slate-200 bg-slate-100 text-slate-700',
  removed: 'border-slate-200 bg-slate-100 text-slate-700',
  revoked: 'border-slate-200 bg-slate-100 text-slate-700',
  withdrawn: 'border-slate-200 bg-slate-100 text-slate-700',
}

export default function StatusBadge({ status }: StatusBadgeProps){
  const value = status ?? 'unknown'
  return (
    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-extrabold capitalize ${tones[value] ?? 'border-slate-200 bg-slate-50 text-slate-700'}`} aria-label={`Status: ${value.replaceAll('_', ' ')}`}>
      {value.replaceAll('_', ' ')}
    </span>
  )
}
