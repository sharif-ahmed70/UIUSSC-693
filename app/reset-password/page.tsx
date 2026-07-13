import Link from 'next/link'
import UpdatePasswordForm from '@/components/auth/UpdatePasswordForm'
import { getAuthenticatedUser } from '@/lib/auth/requireAuthenticatedUser'

export default async function ResetPasswordPage(){
  const user = await getAuthenticatedUser()

  return (
    <div className="bg-uiussc-ivory">
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-orange">Password Recovery</p>
          <h1 className="mt-3 text-3xl font-extrabold text-uiussc-charcoal">Create a new password</h1>
          {user ? (
            <div className="mt-6">
              <UpdatePasswordForm />
            </div>
          ) : (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              This recovery link is invalid or has expired.
            </p>
          )}
          <Link href="/login" className="mt-6 inline-flex text-sm font-bold text-uiussc-navy transition hover:text-uiussc-orange">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
