'use client'

import { useActionState } from 'react'
import type { AdminActionState } from '@/features/admin/types'
import { initialAdminActionState } from '@/features/admin/types'
import type { ClubPosition } from '@/features/admin/queries/getClubPositions'
import {
  createClubPositionAction,
  updateClubPositionAction,
} from '@/features/admin/actions/clubPositionActions'
import ClubPositionFields from '@/components/admin/ClubPositionFields'

export function CreateClubPositionForm(){
  const [state, formAction, pending] = useActionState(createClubPositionAction, initialAdminActionState)

  return (
    <form action={formAction} className="grid gap-4">
      <ClubPositionFields state={state} />
      <ActionMessage state={state} />
      <SubmitButton pending={pending} label="Create position" />
    </form>
  )
}

export function EditClubPositionForm({ position }: { position: ClubPosition }){
  const [state, formAction, pending] = useActionState(updateClubPositionAction, initialAdminActionState)

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="id" value={position.id} />
      <ClubPositionFields position={position} includeStatus state={state} />
      <ActionMessage state={state} />
      <SubmitButton pending={pending} label="Update position" />
    </form>
  )
}

function ActionMessage({ state }: { state: AdminActionState }){
  if (!state.message) return null

  return (
    <p className={`text-sm font-bold ${state.status === 'error' ? 'text-red-700' : 'text-emerald-700'}`} role={state.status === 'error' ? 'alert' : 'status'} aria-live="polite">
      {state.message}
    </p>
  )
}

function SubmitButton({ pending, label }: { pending: boolean; label: string }){
  return (
    <button type="submit" disabled={pending} className="min-h-10 rounded-md bg-uiussc-orange px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#e85d00] disabled:cursor-not-allowed disabled:opacity-60">
      {pending ? 'Working...' : label}
    </button>
  )
}
