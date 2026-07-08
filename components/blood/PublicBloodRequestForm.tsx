'use client'

import { useActionState, useEffect, useRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { bloodGroups } from '@/features/blood/constants'
import { submitPublicBloodRequest } from '@/features/blood/actions'
import { initialBloodFormState } from '@/features/blood/formState'

function error(errors: Record<string, string[]> | undefined, key: string){
  return errors?.[key]?.[0]
}

export default function PublicBloodRequestForm(){
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = useActionState(submitPublicBloodRequest, initialBloodFormState)

  useEffect(() => {
    if (state.status === 'success') formRef.current?.reset()
  }, [state.status])

  return (
    <form ref={formRef} action={formAction} className="rounded-md border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field name="requesterName" label="Requester name" error={error(state.fieldErrors, 'requesterName')} required />
        <Field name="phone" label="Phone" type="tel" error={error(state.fieldErrors, 'phone')} required />
        <Field name="email" label="Email" type="email" error={error(state.fieldErrors, 'email')} />
        <Select name="bloodGroup" label="Blood group" options={bloodGroups} error={error(state.fieldErrors, 'bloodGroup')} required />
        <Field name="unitsRequested" label="Units requested" type="number" min="1" max="8" error={error(state.fieldErrors, 'unitsRequested')} required />
        <Field name="neededAt" label="Required date and time" type="datetime-local" error={error(state.fieldErrors, 'neededAt')} required />
        <Field name="hospitalName" label="Hospital name" error={error(state.fieldErrors, 'hospitalName')} required />
        <Field name="hospitalArea" label="Hospital area" error={error(state.fieldErrors, 'hospitalArea')} />
        <Field name="district" label="District" error={error(state.fieldErrors, 'district')} />
        <Select name="urgency" label="Urgency" options={['normal', 'urgent', 'emergency']} error={error(state.fieldErrors, 'urgency')} required />
        <Field name="requesterRelationship" label="Relationship to patient" error={error(state.fieldErrors, 'requesterRelationship')} />
        <Field name="patientReference" label="Patient reference" error={error(state.fieldErrors, 'patientReference')} />
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">Requests are reviewed by UIUSSC Blood Department before operational use. Private contact details are not published.</p>
      {state.message && <Message status={state.status} message={state.message} />}
      <button type="submit" disabled={isPending} className="mt-5 rounded-md bg-uiussc-navy px-5 py-3 text-sm font-extrabold text-white transition hover:bg-uiussc-green focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-green/20 disabled:opacity-60">
        {isPending ? 'Submitting...' : 'Submit blood request'}
      </button>
    </form>
  )
}

function Field({ name, label, error: message, required = false, ...props }: { name: string; label: string; error?: string; required?: boolean } & InputHTMLAttributes<HTMLInputElement>){
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-bold text-uiussc-navy">{label}{required && <span className="text-uiussc-green"> *</span>}</label>
      <input id={name} name={name} className="field" required={required} aria-invalid={Boolean(message)} aria-describedby={message ? `${name}-error` : undefined} {...props} />
      {message && <p id={`${name}-error`} className="text-sm font-semibold text-red-700">{message}</p>}
    </div>
  )
}

function Select({ name, label, options, error: message, required = false }: { name: string; label: string; options: readonly string[]; error?: string; required?: boolean }){
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-bold text-uiussc-navy">{label}{required && <span className="text-uiussc-green"> *</span>}</label>
      <select id={name} name={name} className="field" required={required} defaultValue="" aria-invalid={Boolean(message)} aria-describedby={message ? `${name}-error` : undefined}>
        <option value="" disabled>Select {label.toLowerCase()}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      {message && <p id={`${name}-error`} className="text-sm font-semibold text-red-700">{message}</p>}
    </div>
  )
}

function Message({ status, message }: { status: string; message: string }){
  return <p className={`mt-4 rounded-md border p-3 text-sm font-semibold ${status === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-800'}`} role="status">{message}</p>
}
