'use client'

import { useActionState } from 'react'
import type { ReactNode } from 'react'
import type { BloodFormState } from '@/features/blood/formState'
import { initialBloodFormState } from '@/features/blood/formState'

type BloodActionFormProps = {
  action: (state: BloodFormState, formData: FormData) => Promise<BloodFormState>
  children: ReactNode
  submitLabel: string
}

export default function BloodActionForm({ action, children, submitLabel }: BloodActionFormProps){
  const [state, formAction, isPending] = useActionState(action, initialBloodFormState)

  return (
    <form action={formAction} className="space-y-3">
      {children}
      {state.message && (
        <p className={`rounded-md border px-3 py-2 text-sm font-semibold ${state.status === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-800'}`} role="status">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={isPending} className="rounded-md bg-uiussc-navy px-4 py-2 text-sm font-extrabold text-white transition hover:bg-uiussc-green focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-green/20 disabled:opacity-60">
        {isPending ? 'Working...' : submitLabel}
      </button>
    </form>
  )
}
