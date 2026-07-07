'use client'

import Link from 'next/link'
import { useMemo, useState, useActionState } from 'react'
import type { AdminActionState } from '@/features/admin/types'
import { initialAdminActionState } from '@/features/admin/types'
import { setupStaffAccessAction } from '@/features/staff-setup/actions'
import { staffSetupTemplateGroups, staffSetupTemplates } from '@/features/staff-setup/templates'

type DepartmentOption = {
  id: string
  name: string
  slug: string
}

type ExistingRecord = {
  label: string
  value: string
}

type StaffSetupWizardProps = {
  profileId: string
  departments: DepartmentOption[]
  existingPositions: ExistingRecord[]
  existingWebsiteAccess: ExistingRecord[]
  existingDepartments: ExistingRecord[]
}

export default function StaffSetupWizard({ profileId, departments, existingPositions, existingWebsiteAccess, existingDepartments }: StaffSetupWizardProps){
  const [selectedTemplate, setSelectedTemplate] = useState(staffSetupTemplates[0].key)
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? '')
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(setupStaffAccessAction, initialAdminActionState)
  const template = useMemo(() => staffSetupTemplates.find((item) => item.key === selectedTemplate) ?? staffSetupTemplates[0], [selectedTemplate])
  const templateDepartment = template.departmentSlug ? departments.find((department) => department.slug === template.departmentSlug) : null
  const selectedDepartment = templateDepartment ?? departments.find((department) => department.id === departmentId)
  const submittedDepartmentId = selectedDepartment?.id ?? departmentId
  const existingPositionLabels = new Set(existingPositions.map((item) => item.value))

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="profileId" value={profileId} />
      <input type="hidden" name="templateKey" value={selectedTemplate} />
      {submittedDepartmentId && <input type="hidden" name="departmentId" value={submittedDepartmentId} />}

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-orange">Step 2</p>
        <h2 className="mt-2 text-xl font-extrabold text-uiussc-charcoal">Choose responsibility</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Choose the official UIUSSC responsibility. Department responsibilities are linked automatically to the correct department and role.</p>
        <div className="mt-4 grid gap-5">
          {staffSetupTemplateGroups.map((group) => (
            <div key={group}>
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-slate-500">{group}</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {staffSetupTemplates.filter((item) => item.group === group).map((item) => {
                  const active = item.key === selectedTemplate
                  const alreadyAssigned = existingPositionLabels.has(item.officialPosition)
                  return (
                    <label key={item.key} className={`cursor-pointer rounded-md border p-4 transition focus-within:ring-4 focus-within:ring-uiussc-orange/20 ${active ? 'border-uiussc-orange bg-orange-50' : 'border-slate-200 bg-white hover:border-uiussc-orange'}`}>
                      <input type="radio" name="templateChoice" value={item.key} checked={active} onChange={() => setSelectedTemplate(item.key)} className="sr-only" />
                      <span className="block text-base font-extrabold text-uiussc-charcoal">{item.title}</span>
                      <span className="mt-2 block text-sm leading-6 text-slate-600">{item.description}</span>
                      {alreadyAssigned && <span className="mt-3 inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-extrabold text-emerald-700">Already assigned</span>}
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-extrabold text-uiussc-charcoal">Custom Setup</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Use Advanced Security pages only for exceptional access changes such as Super Admin. The guided setup intentionally excludes those actions.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/admin/platform-roles" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:border-uiussc-orange">Advanced website access</Link>
            <Link href="/admin/club-positions" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:border-uiussc-orange">Position definitions</Link>
          </div>
        </div>
      </section>

      {template.departmentRequired && (
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          {template.departmentSlug ? (
            <div>
              <p className="text-sm font-bold text-uiussc-charcoal">Department responsibility</p>
              <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{selectedDepartment?.name ?? 'Department will be resolved when official departments are active.'}</p>
            </div>
          ) : (
            <label htmlFor="departmentId" className="grid gap-2 text-sm font-bold text-uiussc-charcoal">
              Department responsibility
              <select id="departmentId" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} required className="min-h-11 rounded-md border border-slate-200 px-3 py-2 font-normal text-slate-900 focus:border-uiussc-orange focus:outline-none focus:ring-4 focus:ring-uiussc-orange/15">
                <option value="">Select department</option>
                {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
              </select>
            </label>
          )}
        </section>
      )}

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-orange">Step 3</p>
        <h2 className="mt-2 text-xl font-extrabold text-uiussc-charcoal">Review and confirm</h2>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          <Preview label="Official position" value={template.officialPosition} />
          <Preview label="Responsibility scope" value={template.websiteAccess} />
          <Preview label="Department" value={template.departmentRequired ? (selectedDepartment?.name ?? 'Select a department') : 'No department required'} />
        </dl>
        {existingPositions.length + existingWebsiteAccess.length + existingDepartments.length > 0 && (
          <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-4">
            <h3 className="font-extrabold text-emerald-900">Existing access found</h3>
            <p className="mt-2 text-sm leading-6 text-emerald-800">Already assigned items will be preserved and will not be duplicated.</p>
          </div>
        )}
        {state.message && (
          <p className={`mt-4 text-sm font-bold ${state.status === 'error' ? 'text-red-700' : 'text-emerald-700'}`} role={state.status === 'error' ? 'alert' : 'status'} aria-live="polite">
            {state.message}
          </p>
        )}
        {state.status === 'success' && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/admin/volunteers/${profileId}`} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:border-uiussc-orange">View staff profile</Link>
            <Link href="/admin/volunteers" className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:border-uiussc-orange">Manage another staff member</Link>
            <Link href="/staff" className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:border-uiussc-orange">Open Staff Dashboard</Link>
          </div>
        )}
        <button type="submit" disabled={pending || (template.departmentRequired && !submittedDepartmentId)} className="mt-5 min-h-11 rounded-md bg-uiussc-orange px-5 py-2 text-sm font-extrabold text-white transition hover:bg-[#e85d00] disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? 'Completing setup...' : 'Confirm staff setup'}
        </button>
      </section>
    </form>
  )
}

function Preview({ label, value }: { label: string; value: string }){
  return <div><dt className="font-bold text-slate-500">{label}</dt><dd className="mt-1 font-extrabold text-uiussc-charcoal">{value}</dd></div>
}
