'use client'

import { useActionState, useEffect, useRef } from 'react'
import Button from '@/components/Button'
import { submitMembershipApplication } from '@/features/membership/actions/submitMembershipApplication'
import { initialMembershipFormState, type MembershipField, type MembershipFieldErrors } from '@/features/membership/types'
import { bloodGroups, departments, trimesters, volunteerDepartments } from '@/data/membership'

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

function fieldError(errors: MembershipFieldErrors | undefined, field: MembershipField){
  return errors?.[field]?.[0]
}

function FieldError({ id, message }: { id: string; message?: string }){
  if(!message) return null

  return (
    <p id={id} className="text-sm font-semibold text-red-700">
      {message}
    </p>
  )
}

function fieldA11y(id: MembershipField, errors: MembershipFieldErrors | undefined){
  const error = fieldError(errors, id)

  return {
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${id}-error` : undefined,
  }
}

function SelectField({
  id,
  label,
  options,
  errors,
  required = false,
}: {
  id: MembershipField
  label: string
  options: string[]
  errors?: MembershipFieldErrors
  required?: boolean
}){
  const error = fieldError(errors, id)

  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id} required={required}>{label}</FieldLabel>
      <select id={id} name={id} className="field" required={required} defaultValue="" {...fieldA11y(id, errors)}>
        <option value="" disabled>Select {label.toLowerCase()}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

function InputField({
  id,
  label,
  errors,
  type = 'text',
  required = false,
}: {
  id: MembershipField
  label: string
  errors?: MembershipFieldErrors
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

function TextareaField({
  id,
  label,
  errors,
  rows = 4,
  required = false,
}: {
  id: MembershipField
  label: string
  errors?: MembershipFieldErrors
  rows?: number
  required?: boolean
}){
  const error = fieldError(errors, id)

  return (
    <div className="space-y-2 md:col-span-2">
      <FieldLabel htmlFor={id} required={required}>{label}</FieldLabel>
      <textarea id={id} name={id} className="field" rows={rows} required={required} {...fieldA11y(id, errors)} />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

export default function MembershipForm(){
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = useActionState(submitMembershipApplication, initialMembershipFormState)
  const isSuccess = state.status === 'success'
  const isError = state.status === 'validation_error' || state.status === 'duplicate' || state.status === 'error'

  useEffect(() => {
    if(isSuccess){
      formRef.current?.reset()
    }
  }, [isSuccess])

  return (
    <form ref={formRef} action={formAction} className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6" noValidate>
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset disabled={isPending}>
        <legend className="text-lg font-bold text-uiussc-navy">Personal Information</legend>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField id="fullName" label="Full Name" errors={state.fieldErrors} required />
          <InputField id="email" label="Email" errors={state.fieldErrors} type="email" required />
          <InputField id="phone" label="Phone Number" errors={state.fieldErrors} type="tel" required />
          <SelectField id="bloodGroup" label="Blood Group" options={bloodGroups} errors={state.fieldErrors} required />
        </div>
      </fieldset>

      <fieldset disabled={isPending}>
        <legend className="text-lg font-bold text-uiussc-navy">Academic Information</legend>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField id="studentId" label="UIU Student ID" errors={state.fieldErrors} required />
          <SelectField id="department" label="Department" options={departments} errors={state.fieldErrors} required />
          <SelectField id="trimester" label="Trimester" options={trimesters} errors={state.fieldErrors} required />
        </div>
      </fieldset>

      <fieldset disabled={isPending}>
        <legend className="text-lg font-bold text-uiussc-navy">Volunteer Preference</legend>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField id="interestedDepartment" label="Interested Department" options={volunteerDepartments} errors={state.fieldErrors} required />
          <TextareaField id="skills" label="Skills or previous volunteer experience" errors={state.fieldErrors} />
          <TextareaField id="motivation" label="Why do you want to join UIUSSC?" errors={state.fieldErrors} required />
        </div>
      </fieldset>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
        Submitted information will be used only for club membership and volunteer coordination.
      </div>

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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? 'Submitting...' : 'Submit Membership Application'}
        </Button>
      </div>
    </form>
  )
}
