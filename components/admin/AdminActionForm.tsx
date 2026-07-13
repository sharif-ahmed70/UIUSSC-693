'use client'

import { useActionState } from 'react'
import type { AdminActionState } from '@/features/admin/types'
import { initialAdminActionState } from '@/features/admin/types'

type AdminActionFormProps = {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>
  id?: string
  submitLabel: string
  fields?: React.ReactNode
  danger?: boolean
}

export default function AdminActionForm({ action, id, submitLabel, fields, danger }: AdminActionFormProps){
  const [state, formAction, pending] = useActionState(action, initialAdminActionState)

  return (
    <form action={formAction} className="grid gap-3">
      {id && <input type="hidden" name="id" value={id} />}
      {fields}
      {state.message && (
        <p className={`text-sm font-bold ${state.status === 'error' ? 'text-red-700' : 'text-emerald-700'}`} role={state.status === 'error' ? 'alert' : 'status'} aria-live="polite">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className={`min-h-10 rounded-md px-4 py-2 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${danger ? 'bg-red-700 text-white hover:bg-red-800' : 'bg-uiussc-orange text-white hover:bg-[#e85d00]'}`}>
        {pending ? 'Working...' : submitLabel}
      </button>
    </form>
  )
}
