'use client'

import { useActionState, useEffect, useRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { bloodAvailabilityStatuses, bloodGroups } from '@/features/blood/constants'
import { submitPublicBloodDonor } from '@/features/blood/actions'
import { initialBloodFormState } from '@/features/blood/formState'

function fieldError(errors: Record<string, string[]> | undefined, key: string){
  return errors?.[key]?.[0]
}

export default function PublicBloodDonorForm(){
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = useActionState(submitPublicBloodDonor, initialBloodFormState)

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
        <Field name="displayName" label="Full name" error={fieldError(state.fieldErrors, 'displayName')} required />
        <Field name="phone" label="Phone" type="tel" error={fieldError(state.fieldErrors, 'phone')} required />
        <Field name="email" label="Email" type="email" error={fieldError(state.fieldErrors, 'email')} />
        <Select name="bloodGroup" label="Blood group" options={bloodGroups} error={fieldError(state.fieldErrors, 'bloodGroup')} required />
        <Field name="district" label="District" error={fieldError(state.fieldErrors, 'district')} />
        <Field name="area" label="Area" error={fieldError(state.fieldErrors, 'area')} />
        <Select name="availabilityStatus" label="Availability" options={bloodAvailabilityStatuses} error={fieldError(state.fieldErrors, 'availabilityStatus')} required />
        <Select name="preferredContactMethod" label="Preferred contact method" options={['phone', 'sms', 'whatsapp', 'email']} error={fieldError(state.fieldErrors, 'preferredContactMethod')} required />
        <Field name="lastDonationDate" label="Last donation date" type="date" error={fieldError(state.fieldErrors, 'lastDonationDate')} />
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">Your information will be used only for UIUSSC donor coordination after human review and consent-based contact.</p>
      {state.message && <p className={`mt-4 rounded-md border p-3 text-sm font-semibold ${state.status === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-800'}`} role="status">{state.message}</p>}
      <button type="submit" disabled={isPending} className="mt-5 rounded-md bg-uiussc-navy px-5 py-3 text-sm font-extrabold text-white transition hover:bg-uiussc-green focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-green/20 disabled:opacity-60">
        {isPending ? 'Submitting...' : 'Register as potential donor'}
      </button>
    </form>
  )
}

function Field({ name, label, error, required = false, ...props }: { name: string; label: string; error?: string; required?: boolean } & InputHTMLAttributes<HTMLInputElement>){
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-bold text-uiussc-navy">{label}{required && <span className="text-uiussc-green"> *</span>}</label>
      <input id={name} name={name} className="field" required={required} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} {...props} />
      {error && <p id={`${name}-error`} className="text-sm font-semibold text-red-700">{error}</p>}
    </div>
  )
}

function Select({ name, label, options, error, required = false }: { name: string; label: string; options: readonly string[]; error?: string; required?: boolean }){
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-bold text-uiussc-navy">{label}{required && <span className="text-uiussc-green"> *</span>}</label>
      <select id={name} name={name} className="field" required={required} defaultValue="" aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined}>
        <option value="" disabled>Select {label.toLowerCase()}</option>
        {options.map((option) => <option key={option} value={option}>{option.replace(/_/g, ' ')}</option>)}
      </select>
      {error && <p id={`${name}-error`} className="text-sm font-semibold text-red-700">{error}</p>}
    </div>
  )
}
