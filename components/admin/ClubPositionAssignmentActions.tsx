'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import type { AdminActionState } from '@/features/admin/types'
import { initialAdminActionState } from '@/features/admin/types'
import {
  changePrimaryClubPositionAction,
  completeVolunteerClubPositionAction,
  revokeVolunteerClubPositionAction,
} from '@/features/admin/actions/clubPositionActions'

type ClubPositionAssignmentActionsProps = {
  assignmentId: string
  isPrimary: boolean
  status: string
  termStart: string
}

export default function ClubPositionAssignmentActions({ assignmentId, isPrimary, status, termStart }: ClubPositionAssignmentActionsProps){
  if (status !== 'active') return null

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {!isPrimary && (
        <ActionDialog
          title="Make Primary"
          submitLabel="Make primary"
          action={changePrimaryClubPositionAction}
          id={assignmentId}
          description="This marks the selected active position as the volunteer's primary official club position. Platform permissions remain unchanged."
          fields={<ReasonField id="primary-reason" label="Reason for making primary" optional />}
        />
      )}
      {isPrimary && <span className="inline-flex min-h-10 items-center rounded-md bg-emerald-50 px-3 py-2 text-sm font-extrabold text-emerald-800">Already primary</span>}
      <ActionDialog
        title="Complete Term"
        submitLabel="Complete term"
        action={completeVolunteerClubPositionAction}
        id={assignmentId}
        description="Use this for a normal leadership transition at the end of an official term. The assignment history stays preserved and platform roles remain unchanged."
        fields={
          <>
            <input type="hidden" name="termStart" value={termStart} />
            <DateField id="termEnd" name="termEnd" label="Term end date" min={termStart} required />
            <ReasonField id="complete-reason" label="Reason for completing term" optional />
          </>
        }
      />
      <ActionDialog
        title="Revoke Position"
        submitLabel="Revoke position"
        action={revokeVolunteerClubPositionAction}
        id={assignmentId}
        danger
        description="Use revocation only to correct or remove an invalid or unauthorized appointment. It preserves history and does not change platform roles."
        fields={<ReasonField id="revoke-reason" label="Reason for revoking position" />}
      />
    </div>
  )
}

function ActionDialog({ title, submitLabel, action, id, description, fields, danger }: {
  title: string
  submitLabel: string
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>
  id: string
  description: string
  fields: React.ReactNode
  danger?: boolean
}){
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(action, initialAdminActionState)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (state.status === 'success') setOpen(false)
  }, [state.status])

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`min-h-10 rounded-md px-4 py-2 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-4 ${danger ? 'bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-200' : 'bg-uiussc-charcoal text-white hover:bg-slate-800 focus-visible:ring-uiussc-orange/20'}`}>
        {title}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby={`${id}-${title}-title`}>
          <div ref={panelRef} tabIndex={-1} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-md bg-white p-5 shadow-2xl focus:outline-none">
            <h3 id={`${id}-${title}-title`} className="text-xl font-extrabold text-uiussc-charcoal">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            <form action={formAction} className="mt-4 grid gap-4">
              <input type="hidden" name="id" value={id} />
              {fields}
              {state.message && <p role={state.status === 'error' ? 'alert' : 'status'} aria-live="polite" className={`text-sm font-bold ${state.status === 'error' ? 'text-red-700' : 'text-emerald-700'}`}>{state.message}</p>}
              <div className="flex flex-wrap justify-end gap-3">
                <button type="button" onClick={() => setOpen(false)} className="min-h-10 rounded-md border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-700 hover:border-uiussc-orange focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/15">
                  Cancel
                </button>
                <button type="submit" disabled={pending} className={`min-h-10 rounded-md px-4 py-2 text-sm font-extrabold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${danger ? 'bg-red-700 hover:bg-red-800' : 'bg-uiussc-orange hover:bg-[#e85d00]'}`}>
                  {pending ? 'Working...' : submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function ReasonField({ id, label, optional }: { id: string; label: string; optional?: boolean }){
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700" htmlFor={id}>
      {label}{!optional && <span className="text-uiussc-orange"> *</span>}
      <textarea id={id} name="reason" required={!optional} className="min-h-24 rounded-md border border-slate-200 p-3 text-sm font-normal text-slate-900 focus:border-uiussc-orange focus:outline-none focus:ring-4 focus:ring-uiussc-orange/15" />
    </label>
  )
}

function DateField({ id, name, label, min, required }: { id: string; name: string; label: string; min: string; required?: boolean }){
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700" htmlFor={id}>
      {label}{required && <span className="text-uiussc-orange"> *</span>}
      <input id={id} name={name} type="date" min={min} required={required} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900 focus:border-uiussc-orange focus:outline-none focus:ring-4 focus:ring-uiussc-orange/15" />
    </label>
  )
}
