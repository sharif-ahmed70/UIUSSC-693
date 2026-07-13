import Link from 'next/link'
import { redirect } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import { resolveStaffDestination } from '@/features/staff/routing/resolveStaffDestination'
import { safeRedirectPath } from '@/lib/auth/safeRedirect'

type LoginPageProps = {
  searchParams: Promise<{ next?: string; message?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps){
  const params = await searchParams
  const next = safeRedirectPath(params.next, '/staff')
  const access = await getStaffAccessContext()

  if (access.userId) {
    redirect(resolveStaffDestination(access, next))
  }

  return (
    <div className="bg-uiussc-ivory">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-md bg-uiussc-charcoal p-8 text-white shadow-2xl shadow-slate-900/15">
          <Link href="/" className="inline-flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/30">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-uiussc-orange text-sm font-extrabold">US</span>
            <span>
              <span className="block text-xl font-extrabold">UIUSSC</span>
              <span className="text-sm text-slate-300">Serving Humanity, Building Community</span>
            </span>
          </Link>
          <h1 className="mt-10 text-4xl font-extrabold leading-tight">Staff access for approved UIUSSC volunteers.</h1>
          <p className="mt-4 leading-7 text-slate-300">
            UIUSSC staff accounts are activated after membership and department approval. Non-members can apply through the public membership form.
          </p>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-orange">Secure Login</p>
          <h2 className="mt-3 text-3xl font-extrabold text-uiussc-charcoal">Sign in</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Use the email address connected to your approved UIUSSC staff account.</p>
          <div className="mt-6">
            <LoginForm next={next} message={params.message} />
          </div>
          <Link href="/" className="mt-6 inline-flex text-sm font-bold text-uiussc-navy transition hover:text-uiussc-orange">
            Back to home
          </Link>
        </section>
      </div>
    </div>
  )
}
