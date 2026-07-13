'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { signInAction } from '@/features/auth/actions/signIn'
import { initialActionState } from '@/features/auth/types'
import AuthStatusMessage from './AuthStatusMessage'

type LoginFormProps = {
  next?: string
  message?: string
}

export default function LoginForm({ next, message }: LoginFormProps){
  const [state, action, pending] = useActionState(signInAction, initialActionState)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next ?? ''} />
      {message === 'password-updated' && <AuthStatusMessage type="success" message="Your password has been updated. Please sign in again." />}
      <AuthStatusMessage type="error" message={state.status === 'error' ? state.message : undefined} />

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-bold text-slate-800">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-uiussc-orange focus:ring-4 focus:ring-uiussc-orange/15"
          aria-describedby={state.fieldErrors?.email ? 'email-error' : undefined}
        />
        {state.fieldErrors?.email && <p id="email-error" className="text-sm text-red-700">{state.fieldErrors.email[0]}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-bold text-slate-800">Password</label>
        <div className="flex rounded-md border border-slate-200 bg-white focus-within:border-uiussc-orange focus-within:ring-4 focus-within:ring-uiussc-orange/15">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="min-w-0 flex-1 rounded-md px-4 py-3 text-slate-900 outline-none"
            aria-describedby={state.fieldErrors?.password ? 'password-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="min-h-11 px-4 text-sm font-bold text-uiussc-navy transition hover:text-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {state.fieldErrors?.password && <p id="password-error" className="text-sm text-red-700">{state.fieldErrors.password[0]}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href="/forgot-password" className="font-bold text-uiussc-navy underline-offset-4 transition hover:text-uiussc-orange hover:underline">
          Forgot password?
        </Link>
        <Link href="/membership" className="font-bold text-uiussc-navy underline-offset-4 transition hover:text-uiussc-orange hover:underline">
          Apply for membership
        </Link>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full rounded-md bg-uiussc-orange px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-uiussc-orange/20 transition hover:bg-[#e85d00] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}
