'use client'

import { useActionState, useEffect, useRef } from 'react'
import Button from '@/components/Button'
import { submitContactMessage } from '@/features/contact/actions/submitContactMessage'
import { initialContactActionState, type ContactField, type ContactFieldErrors } from '@/features/contact/types'

function fieldError(errors: ContactFieldErrors | undefined, field: ContactField){
  return errors?.[field]?.[0]
}

function fieldA11y(id: ContactField, errors: ContactFieldErrors | undefined){
  const error = fieldError(errors, id)

  return {
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${id}-error` : undefined,
  }
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }){
  return (
    <label htmlFor={htmlFor} className="text-sm font-bold text-uiussc-navy">
      {children}<span className="text-uiussc-green" aria-label="required"> *</span>
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
  className = '',
}: {
  id: ContactField
  label: string
  errors?: ContactFieldErrors
  type?: string
  className?: string
}){
  const error = fieldError(errors, id)

  return (
    <div className={`space-y-2 ${className}`}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input id={id} name={id} className="field" type={type} required {...fieldA11y(id, errors)} />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

export default function ContactForm(){
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = useActionState(submitContactMessage, initialContactActionState)
  const isSuccess = state.status === 'success'
  const isError = state.status === 'validation_error' || state.status === 'error'

  useEffect(() => {
    if(isSuccess){
      formRef.current?.reset()
    }
  }, [isSuccess])

  return (
    <form ref={formRef} action={formAction} className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl" noValidate>
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset disabled={isPending}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField id="name" label="Name" errors={state.fieldErrors} />
          <InputField id="email" label="Email" errors={state.fieldErrors} type="email" />
          <InputField id="subject" label="Subject" errors={state.fieldErrors} className="md:col-span-2" />

          <div className="space-y-2 md:col-span-2">
            <FieldLabel htmlFor="message">Message</FieldLabel>
            <textarea id="message" name="message" className="field" rows={6} required {...fieldA11y('message', state.fieldErrors)} />
            <FieldError id="message-error" message={fieldError(state.fieldErrors, 'message')} />
          </div>
        </div>
      </fieldset>

      {state.message && (
        <div
          className={`mt-5 rounded-lg border p-4 text-sm font-semibold leading-6 ${
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
        <p className="mt-4 text-sm font-semibold text-red-700" aria-live="polite">
          Review the field notes above before sending again.
        </p>
      )}

      <div className="mt-5">
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? 'Sending...' : 'Send Message'}
        </Button>
      </div>
    </form>
  )
}
