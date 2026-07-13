'use client'

import { useActionState, useState } from 'react'
import type { AdminActionState } from '@/features/admin/types'
import { initialAdminActionState } from '@/features/admin/types'
import type { InvitationFormOptions } from '@/features/invitations/types'

type InvitationPlanFormProps = {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>
  options: InvitationFormOptions
}

const departmentRoles = [
  { value: 'department_head', label: 'Department Head' },
  { value: 'deputy_head', label: 'Deputy Head' },
  { value: 'executive', label: 'Executive' },
] as const

export default function InvitationPlanForm({ action, options }: InvitationPlanFormProps){
  const [state, formAction, pending] = useActionState(action, initialAdminActionState)
  const [scopeRows, setScopeRows] = useState([0])

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-2">
        <label htmlFor="invitedEmail" className="text-sm font-extrabold text-uiussc-charcoal">Invitee email <span className="text-red-700">*</span></label>
        <input id="invitedEmail" name="invitedEmail" type="email" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" required />
      </div>

      <div className="grid gap-2">
        <label htmlFor="invitedName" className="text-sm font-extrabold text-uiussc-charcoal">Invitee name</label>
        <input id="invitedName" name="invitedName" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
      </div>

      <div className="grid gap-2">
        <label htmlFor="intendedClubPositionId" className="text-sm font-extrabold text-uiussc-charcoal">Intended club position</label>
        <select id="intendedClubPositionId" name="intendedClubPositionId" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
          <option value="">No club position intent</option>
          {options.positions.map((position) => (
            <option key={position.id} value={position.id}>{position.name}</option>
          ))}
        </select>
        <p className="text-xs text-slate-500">Intent is not actual access. Position assignment remains a separate approved workflow.</p>
      </div>

      <div className="grid gap-2">
        <label htmlFor="intendedPlatformRole" className="text-sm font-extrabold text-uiussc-charcoal">Intended platform role</label>
        <select id="intendedPlatformRole" name="intendedPlatformRole" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
          <option value="">No platform role intent</option>
          <option value="club_admin">Club Admin</option>
          <option value="membership_admin">Membership Admin</option>
          <option value="content_admin">Content Admin</option>
          <option value="department_admin">Department Admin</option>
        </select>
        <p className="text-xs text-slate-500">Super Admin intent is intentionally unavailable here.</p>
      </div>

      <fieldset className="grid gap-3 rounded-md border border-slate-200 p-4">
        <legend className="px-1 text-sm font-extrabold text-uiussc-charcoal">Intended department scopes</legend>
        <p className="text-xs leading-5 text-slate-500">Add active departments only. Duplicate department selections are rejected by validation.</p>
        {scopeRows.map((row) => (
          <div key={row} className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-uiussc-charcoal">
              Department
              <select name="departmentIds" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm font-normal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
                <option value="">No department</option>
                {options.departments.map((department) => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-uiussc-charcoal">
              Intended role
              <select name="departmentRoles" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm font-normal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
                {departmentRoles.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </label>
          </div>
        ))}
        <button type="button" onClick={() => setScopeRows((rows) => [...rows, Math.max(...rows) + 1])} className="justify-self-start rounded-md border border-slate-200 px-3 py-2 text-sm font-extrabold text-uiussc-charcoal transition hover:border-uiussc-orange hover:text-uiussc-orange">
          Add department scope
        </button>
      </fieldset>

      <div className="grid gap-2">
        <label htmlFor="expiresAt" className="text-sm font-extrabold text-uiussc-charcoal">Expiry date and time</label>
        <input id="expiresAt" name="expiresAt" type="datetime-local" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
      </div>

      <div className="grid gap-2">
        <label htmlFor="invitationReason" className="text-sm font-extrabold text-uiussc-charcoal">Reason <span className="text-red-700">*</span></label>
        <textarea id="invitationReason" name="reason" className="min-h-24 rounded-md border border-slate-200 p-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" required />
      </div>

      {state.message && (
        <p className={`text-sm font-bold ${state.status === 'error' ? 'text-red-700' : 'text-emerald-700'}`} role={state.status === 'error' ? 'alert' : 'status'} aria-live="polite">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="min-h-10 rounded-md bg-uiussc-orange px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#e85d00] disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? 'Working...' : 'Create invitation plan'}
      </button>
    </form>
  )
}
