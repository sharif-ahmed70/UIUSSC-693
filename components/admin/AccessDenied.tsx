import Link from 'next/link'

export default function AccessDenied(){
  return (
    <div className="mx-auto max-w-2xl rounded-md border border-slate-200 bg-white p-8 text-center shadow-lg shadow-slate-900/5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-orange">Access restricted</p>
      <h1 className="mt-3 text-3xl font-extrabold text-uiussc-charcoal">Administration access unavailable</h1>
      <p className="mt-4 leading-7 text-slate-600">Your account does not currently have permission to use the UIUSSC administration area.</p>
      <Link href="/staff" className="mt-6 inline-flex rounded-md bg-uiussc-orange px-5 py-3 text-sm font-extrabold text-white">
        Back to staff dashboard
      </Link>
    </div>
  )
}
