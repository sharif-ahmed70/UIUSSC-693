'use client'

import { useActionState, useEffect, useRef } from 'react'
import Button from '@/components/Button'
import { bloodGroups } from '@/data/membership'
import { submitEventRegistration } from '@/features/event-registration/actions/submitEventRegistration'
import {
  initialEventRegistrationActionState,
  type EventRegistrationField,
  type EventRegistrationFieldErrors,
} from '@/features/event-registration/types'

function fieldError(errors: EventRegistrationFieldErrors | undefined, field: EventRegistrationField){
  return errors?.[field]?.[0]
}

function fieldA11y(id: EventRegistrationField, errors: EventRegistrationFieldErrors | undefined){
  const error = fieldError(errors, id)

  return {
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${id}-error` : undefined,
  }
}

function RequiredMark(){
  return <span className="text-uiussc-green" aria-label="required"> *</span>
}

function FieldLabel({ htmlFor, children, required = false }: { htmlFor: string; children: string; required?: boolean }){
  return (
    <label htmlFor={htmlFor} className="text-sm font-bold text-uiussc-navy">
      {children}{required && <RequiredMark />}
    </label>
  )
}

function FieldError({ id, message }: { id: string; message?: string }){
  if(!message) return null

  return (
    <p id={id} className="text-sm font-semibold text-red-700">
      {message}
    </p>
  )
}

function InputField({
  id,
  label,
  errors,
  type = 'text',
  required = false,
}: {
  id: EventRegistrationField
  label: string
  errors?: EventRegistrationFieldErrors
  type?: string
  required?: boolean
}){
  const error = fieldError(errors, id)

  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id} required={required}>{label}</FieldLabel>
      <input id={id} name={id} type={type} className="field" required={required} {...fieldA11y(id, errors)} />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

export default function EventRegistrationForm({
  eventSlug,
  eventTitle,
}: {
  eventSlug: string
  eventTitle: string
}){
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = useActionState(submitEventRegistration, initialEventRegistrationActionState)
  const isSuccess = state.status === 'success'
  const isError = state.status !== 'idle' && state.status !== 'success'

  useEffect(() => {
    if(isSuccess){
      formRef.current?.reset()
    }
  }, [isSuccess])

  return (
    <form ref={formRef} action={formAction} className="mt-6 space-y-5 rounded-lg border border-emerald-200 bg-white p-5 shadow-sm" noValidate>
      <input type="hidden" name="eventSlug" value={eventSlug} />

      <div className="sr-only" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-uiussc-green">Register Interest</p>
        <h3 className="mt-2 text-xl font-extrabold text-uiussc-navy">{eventTitle}</h3>
      </div>

      <fieldset disabled={isPending}>
        <div className="grid grid-cols-1 gap-4">
          <InputField id="fullName" label="Full Name" errors={state.fieldErrors} required />
          <InputField id="studentId" label="UIU Student ID (Optional)" errors={state.fieldErrors} />
          <InputField id="email" label="Email" errors={state.fieldErrors} type="email" required />
          <InputField id="phone" label="Phone Number" errors={state.fieldErrors} type="tel" required />

          <div className="space-y-2">
            <FieldLabel htmlFor="bloodGroup">Blood Group (Optional)</FieldLabel>
            <select id="bloodGroup" name="bloodGroup" className="field" defaultValue="" {...fieldA11y('bloodGroup', state.fieldErrors)}>
              <option value="">Select blood group</option>
              {bloodGroups.map((bloodGroup) => <option key={bloodGroup} value={bloodGroup}>{bloodGroup}</option>)}
            </select>
            <FieldError id="bloodGroup-error" message={fieldError(state.fieldErrors, 'bloodGroup')} />
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="motivation">Motivation / Why do you want to participate? (Optional)</FieldLabel>
            <textarea id="motivation" name="motivation" className="field" rows={4} {...fieldA11y('motivation', state.fieldErrors)} />
            <FieldError id="motivation-error" message={fieldError(state.fieldErrors, 'motivation')} />
          </div>
        </div>
      </fieldset>

      {state.message && (
        <div
          className={`rounded-lg border p-4 text-sm font-semibold leading-6 ${
            isSuccess
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
          role="status"
          aria-live="polite"
        >
          {state.message}
        </div>
      )}

      {isError && state.fieldErrors && (
        <p className="text-sm font-semibold text-red-700" aria-live="polite">
          Review the field notes above before submitting again.
        </p>
      )}

      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? 'Registering...' : 'Submit Registration'}
      </Button>
    </form>
  )
}
