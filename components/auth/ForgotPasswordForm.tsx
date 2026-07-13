'use client'

import { useActionState } from 'react'
import { requestPasswordResetAction } from '@/features/auth/actions/requestPasswordReset'
import { initialActionState } from '@/features/auth/types'
import AuthStatusMessage from './AuthStatusMessage'

export default function ForgotPasswordForm(){
  const [state, action, pending] = useActionState(requestPasswordResetAction, initialActionState)

  return (
    <form action={action} className="space-y-5">
      <AuthStatusMessage type={state.status === 'success' ? 'success' : 'error'} message={state.message} />
      <div className="space-y-2">
        <label htmlFor="reset-email" className="text-sm font-bold text-slate-800">Email</label>
        <input
          id="reset-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-uiussc-orange focus:ring-4 focus:ring-uiussc-orange/15"
        />
        {state.fieldErrors?.email && <p className="text-sm text-red-700">{state.fieldErrors.email[0]}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full rounded-md bg-uiussc-orange px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-uiussc-orange/20 transition hover:bg-[#e85d00] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Sending...' : 'Send reset instructions'}
      </button>
    </form>
  )
}
