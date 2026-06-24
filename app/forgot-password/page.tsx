import Link from 'next/link'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage(){
  return (
    <div className="bg-uiussc-ivory">
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-orange">Password Recovery</p>
          <h1 className="mt-3 text-3xl font-extrabold text-uiussc-charcoal">Reset your password</h1>
          <p className="mt-3 leading-7 text-slate-600">Enter your staff email. If the account is eligible, reset instructions will be sent.</p>
          <div className="mt-6">
            <ForgotPasswordForm />
          </div>
          <Link href="/login" className="mt-6 inline-flex text-sm font-bold text-uiussc-navy transition hover:text-uiussc-orange">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
