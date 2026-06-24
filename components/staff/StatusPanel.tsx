import Link from 'next/link'
import { signOutAction } from '@/features/auth/actions/signOut'

type StatusPanelProps = {
  eyebrow: string
  title: string
  description: string
  children?: React.ReactNode
}

export default function StatusPanel({ eyebrow, title, description, children }: StatusPanelProps){
  return (
    <div className="bg-uiussc-ivory">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-orange">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-extrabold text-uiussc-charcoal">{title}</h1>
          <p className="mt-4 leading-7 text-slate-600">{description}</p>
          {children && <div className="mt-6">{children}</div>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-extrabold text-uiussc-charcoal transition hover:border-uiussc-orange hover:text-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
              Public website
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="rounded-md bg-uiussc-orange px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#e85d00] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/30">
                Log out
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
