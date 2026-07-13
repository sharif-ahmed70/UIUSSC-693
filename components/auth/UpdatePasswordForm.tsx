'use client'

import { useActionState, useState } from 'react'
import { updatePasswordAction } from '@/features/auth/actions/updatePassword'
import { initialActionState } from '@/features/auth/types'
import AuthStatusMessage from './AuthStatusMessage'

export default function UpdatePasswordForm(){
  const [state, action, pending] = useActionState(updatePasswordAction, initialActionState)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={action} className="space-y-5">
      <AuthStatusMessage type="error" message={state.message} />
      {[
        { id: 'new-password', name: 'password', label: 'New password', autoComplete: 'new-password' },
        { id: 'confirm-password', name: 'confirmPassword', label: 'Confirm password', autoComplete: 'new-password' },
      ].map((field) => (
        <div key={field.name} className="space-y-2">
          <label htmlFor={field.id} className="text-sm font-bold text-slate-800">{field.label}</label>
          <input
            id={field.id}
            name={field.name}
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete={field.autoComplete}
            className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-uiussc-orange focus:ring-4 focus:ring-uiussc-orange/15"
          />
          {state.fieldErrors?.[field.name] && <p className="text-sm text-red-700">{state.fieldErrors[field.name][0]}</p>}
        </div>
      ))}
      <button
        type="button"
        onClick={() => setShowPassword((value) => !value)}
        className="rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-uiussc-navy transition hover:border-uiussc-orange hover:text-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20"
      >
        {showPassword ? 'Hide passwords' : 'Show passwords'}
      </button>
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 w-full rounded-md bg-uiussc-orange px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-uiussc-orange/20 transition hover:bg-[#e85d00] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Updating...' : 'Update password'}
      </button>
    </form>
  )
}
