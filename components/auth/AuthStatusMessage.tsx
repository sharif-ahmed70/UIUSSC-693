type AuthStatusMessageProps = {
  type?: 'error' | 'success' | 'info'
  message?: string
  id?: string
}

export default function AuthStatusMessage({ type = 'info', message, id }: AuthStatusMessageProps){
  if (!message) {
    return null
  }

  const tone = {
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-slate-200 bg-slate-50 text-slate-700',
  }[type]

  return (
    <p id={id} className={`rounded-md border px-4 py-3 text-sm font-medium ${tone}`} role={type === 'error' ? 'alert' : 'status'} aria-live="polite">
      {message}
    </p>
  )
}
