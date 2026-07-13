type ProgressBarProps = {
  value: number
  label: string
}

export default function ProgressBar({ value, label }: ProgressBarProps){
  const safeValue = Math.max(0, Math.min(100, Math.round(value)))

  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
        <span>{label}</span>
        <span>{safeValue}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeValue}>
        <div className="h-2 rounded-full bg-uiussc-orange" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  )
}
