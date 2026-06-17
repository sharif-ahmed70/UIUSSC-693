'use client'

import { FormEvent, useState } from 'react'
import Button from '@/components/Button'
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

function SelectField({ id, label, options, required = false }: { id: string; label: string; options: string[]; required?: boolean }){
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id} required={required}>{label}</FieldLabel>
      <select id={id} name={id} className="field" required={required} defaultValue="">
        <option value="" disabled>Select {label.toLowerCase()}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  )
}

function InputField({ id, label, type = 'text', required = false }: { id: string; label: string; type?: string; required?: boolean }){
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id} required={required}>{label}</FieldLabel>
      <input id={id} name={id} type={type} className="field" required={required} />
    </div>
  )
}

function TextareaField({ id, label, rows = 4, required = false }: { id: string; label: string; rows?: number; required?: boolean }){
  return (
    <div className="space-y-2 md:col-span-2">
      <FieldLabel htmlFor={id} required={required}>{label}</FieldLabel>
      <textarea id={id} name={id} className="field" rows={rows} required={required} />
    </div>
  )
}

export default function MembershipForm(){
  const [message, setMessage] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>){
    event.preventDefault()
    setMessage('Online submission will be available soon.')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6" noValidate>
      <fieldset>
        <legend className="text-lg font-bold text-uiussc-navy">Personal Information</legend>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField id="fullName" label="Full Name" required />
          <InputField id="email" label="Email" type="email" required />
          <InputField id="phone" label="Phone Number" type="tel" required />
          <SelectField id="bloodGroup" label="Blood Group" options={bloodGroups} />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold text-uiussc-navy">Academic Information</legend>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField id="studentId" label="UIU Student ID" required />
          <SelectField id="department" label="Department" options={departments} required />
          <SelectField id="trimester" label="Trimester" options={trimesters} required />
          <InputField id="academicYear" label="Academic Year" />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold text-uiussc-navy">Volunteer Preference</legend>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField id="interestedDepartment" label="Interested Department" options={volunteerDepartments} required />
          <InputField id="preferredActivityType" label="Preferred Activity Type" />
          <TextareaField id="skills" label="Skills or previous volunteer experience" />
          <TextareaField id="motivation" label="Why do you want to join UIUSSC?" required />
        </div>
      </fieldset>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
        Submitted information will be used only for club membership and volunteer coordination. This Phase 1 form is UI-only and does not store data yet.
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" variant="secondary">Check Submission Availability</Button>
        {message && <p className="text-sm font-semibold text-uiussc-navy" role="status">{message}</p>}
      </div>
    </form>
  )
}
