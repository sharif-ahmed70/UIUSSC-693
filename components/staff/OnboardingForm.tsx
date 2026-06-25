'use client'

import { useActionState } from 'react'
import { submitOnboardingAction } from '@/features/staff/actions/submitOnboarding'
import { initialActionState } from '@/features/auth/types'
import AuthStatusMessage from '@/components/auth/AuthStatusMessage'
import type { StaffProfile } from '@/features/staff/types'

type Option = {
  value: string
  label: string
}

type OnboardingFormProps = {
  profile: StaffProfile | null
  email: string | null
  departments: Option[]
}

const academicDepartments = [
  'BBA',
  'Computer Science and Engineering',
  'Computer Science',
  'Electrical and Electronic Engineering',
  'Economics',
  'English',
  'Media Studies and Journalism',
  'Pharmacy',
]

const trimesters = ['1st Trimester', '2nd Trimester', '3rd Trimester', '4th Trimester', '5th Trimester', '6th Trimester', '7th Trimester', '8th Trimester', '9th Trimester', '10th Trimester', '11th Trimester', '12th Trimester']
const bloodGroups = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function OnboardingForm({ profile, email, departments }: OnboardingFormProps){
  const [state, action, pending] = useActionState(submitOnboardingAction, initialActionState)

  return (
    <form action={action} className="space-y-8 rounded-md border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-8">
      <AuthStatusMessage type="error" message={state.message} />

      <div className="grid gap-3 sm:grid-cols-3">
        {['Profile', 'Department', 'Review'].map((step, index) => (
          <div key={step} className="rounded-md border border-slate-200 bg-uiussc-ivory px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-uiussc-orange">Step {index + 1}</p>
            <p className="mt-1 font-bold text-uiussc-charcoal">{step}</p>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Profile information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name" id="fullName" name="fullName" defaultValue={profile?.fullName} required error={state.fieldErrors?.fullName?.[0]} />
          <Field label="Student ID" id="studentId" name="studentId" defaultValue={profile?.studentId} required error={state.fieldErrors?.studentId?.[0]} />
          <Field label="Email" id="email" name="email" type="email" defaultValue={profile?.email ?? email ?? ''} required error={state.fieldErrors?.email?.[0]} />
          <Field label="Phone" id="phone" name="phone" type="tel" defaultValue={profile?.phone} required error={state.fieldErrors?.phone?.[0]} />
          <Select label="Academic department" id="academicDepartment" name="academicDepartment" defaultValue={profile?.academicDepartment ?? ''} options={academicDepartments.map((item) => ({ value: item, label: item }))} required error={state.fieldErrors?.academicDepartment?.[0]} />
          <Select label="Trimester" id="trimester" name="trimester" defaultValue={profile?.trimester ?? ''} options={trimesters.map((item) => ({ value: item, label: item }))} required error={state.fieldErrors?.trimester?.[0]} />
          <Select label="Blood group" id="bloodGroup" name="bloodGroup" defaultValue={profile?.bloodGroup ?? ''} options={bloodGroups.map((item) => ({ value: item, label: item || 'Prefer not to say' }))} error={state.fieldErrors?.bloodGroup?.[0]} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Preferred UIUSSC Department - Optional</h2>
        <Select label="Department request" id="preferredDepartmentId" name="preferredDepartmentId" defaultValue={profile?.primaryDepartmentId ?? ''} options={[{ value: '', label: 'No department / Club-wide executive role' }, ...departments]} error={state.fieldErrors?.preferredDepartmentId?.[0]} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Review and submit</h2>
        <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <input name="consent" type="checkbox" required className="mt-1 h-4 w-4 rounded border-slate-300 text-uiussc-orange focus:ring-uiussc-orange" />
          <span>I confirm that this information is accurate and may be used by UIUSSC for staff onboarding and volunteer coordination.</span>
        </label>
        {state.fieldErrors?.consent && <p className="text-sm text-red-700">{state.fieldErrors.consent[0]}</p>}
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 rounded-md bg-uiussc-orange px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-uiussc-orange/20 transition hover:bg-[#e85d00] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Submitting...' : 'Submit for review'}
        </button>
      </section>
    </form>
  )
}

function Field({ label, id, name, type = 'text', defaultValue, required, error }: {
  label: string
  id: string
  name: string
  type?: string
  defaultValue?: string | null
  required?: boolean
  error?: string
}){
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-bold text-slate-800">{label}{required && <span className="text-uiussc-orange"> *</span>}</label>
      <input id={id} name={name} type={type} defaultValue={defaultValue ?? ''} required={required} className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-uiussc-orange focus:ring-4 focus:ring-uiussc-orange/15" />
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  )
}

function Select({ label, id, name, defaultValue, options, required, error }: {
  label: string
  id: string
  name: string
  defaultValue: string
  options: Option[]
  required?: boolean
  error?: string
}){
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-bold text-slate-800">{label}{required && <span className="text-uiussc-orange"> *</span>}</label>
      <select id={id} name={name} defaultValue={defaultValue} required={required} className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-uiussc-orange focus:ring-4 focus:ring-uiussc-orange/15">
        {required && <option value="">Select one</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  )
}
