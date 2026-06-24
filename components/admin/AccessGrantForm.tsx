'use client'

import { useEffect, useMemo, useState, useActionState } from 'react'
import type { AdminActionState } from '@/features/admin/types'
import { initialAdminActionState } from '@/features/admin/types'
import type { AccessControlSummary, AccessUserSummary, ClubDepartment, SystemPermission } from '@/features/access-control/types'
import { formatPlatformRole, maskEmail } from '@/lib/formatters'

type AccessGrantFormProps = {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>
  users: AccessUserSummary[]
  permissions: SystemPermission[]
  departments: Pick<ClubDepartment, 'id' | 'name' | 'slug'>[]
  events: AccessControlSummary['events']
  selectedUserId?: string
}

export default function AccessGrantForm({ action, users, permissions, departments, events, selectedUserId }: AccessGrantFormProps){
  const [state, formAction, pending] = useActionState(action, initialAdminActionState)
  const [query, setQuery] = useState('')
  const [permissionKey, setPermissionKey] = useState(permissions[0]?.permission_key ?? '')
  const [eventQuery, setEventQuery] = useState('')
  const [scopeType, setScopeType] = useState<'global' | 'department' | 'event'>('global')
  const selectedPermission = permissions.find((permission) => permission.permission_key === permissionKey) ?? permissions[0]

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return users.slice(0, 25)
    return users.filter((user) => {
      const haystack = [
        user.fullName,
        maskEmail(user.email),
        user.accountStatus,
        user.onboardingStatus,
        ...user.activeClubPositions,
        ...user.activePlatformRoles,
        ...user.activeDepartmentMemberships.map((membership) => `${membership.departmentName} ${membership.role}`),
      ].join(' ').toLowerCase()
      return haystack.includes(needle)
    }).slice(0, 25)
  }, [query, users])

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, SystemPermission[]>>((groups, permission) => {
      groups[permission.module_key] = [...(groups[permission.module_key] ?? []), permission]
      return groups
    }, {})
  }, [permissions])

  const canUseGlobal = selectedPermission?.supports_global_scope
  const canUseDepartment = selectedPermission?.supports_department_scope
  const canUseEvent = selectedPermission?.supports_event_scope

  const filteredEvents = useMemo(() => {
    const needle = eventQuery.trim().toLowerCase()
    if (!needle) return events.slice(0, 25)
    return events.filter((event) => `${event.title} ${event.event_date} ${event.status} ${event.operational_status ?? ''}`.toLowerCase().includes(needle)).slice(0, 25)
  }, [eventQuery, events])

  useEffect(() => {
    if (scopeType === 'department' && !canUseDepartment) {
      setScopeType('global')
    } else if (scopeType === 'event' && !canUseEvent) {
      setScopeType(canUseGlobal ? 'global' : 'department')
    } else if (scopeType === 'global' && !canUseGlobal && canUseDepartment) {
      setScopeType('department')
    }
  }, [canUseDepartment, canUseEvent, canUseGlobal, scopeType])

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-2">
        <label htmlFor="access-user-search" className="text-sm font-extrabold text-uiussc-charcoal">Find approved user <span className="text-red-700">*</span></label>
        <input
          id="access-user-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20"
          placeholder="Search by name, masked email, role, department, or status"
        />
        <select name="profileId" defaultValue={selectedUserId ?? ''} className="min-h-12 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" required>
          <option value="">Select a user</option>
          {filteredUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.fullName} - {maskEmail(user.email) ?? 'email hidden'} - {(user.activeClubPositions[0] ?? user.activePlatformRoles.map(formatPlatformRole).join(', ')) || 'No active role'} - {user.accountStatus}/{user.onboardingStatus}
            </option>
          ))}
        </select>
        <p className="text-xs leading-5 text-slate-500">Archived and rejected profiles are excluded. The profile UUID is submitted internally.</p>
      </div>

      <div className="grid gap-2">
        <label htmlFor="permissionKey" className="text-sm font-extrabold text-uiussc-charcoal">Permission <span className="text-red-700">*</span></label>
        <select id="permissionKey" name="permissionKey" value={permissionKey} onChange={(event) => setPermissionKey(event.target.value)} className="min-h-12 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" required>
          {Object.entries(groupedPermissions).map(([moduleKey, modulePermissions]) => (
            <optgroup key={moduleKey} label={moduleKey.replaceAll('_', ' ')}>
              {modulePermissions.map((permission) => (
                <option key={permission.id} value={permission.permission_key}>
                  {permission.name} - {permission.permission_key} - {permission.risk_level}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {selectedPermission && (
          <p className="text-xs leading-5 text-slate-500">
            Supports: {[
              selectedPermission.supports_global_scope ? 'global' : null,
              selectedPermission.supports_department_scope ? 'department' : null,
              selectedPermission.supports_event_scope ? 'event' : null,
              selectedPermission.supports_record_scope ? 'record later' : null,
            ].filter(Boolean).join(', ') || 'no selectable scope'}.
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <label htmlFor="effect" className="text-sm font-extrabold text-uiussc-charcoal">Effect <span className="text-red-700">*</span></label>
        <select id="effect" name="effect" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" required>
          <option value="allow">Allow temporary access</option>
          <option value="deny">Deny / restrict access</option>
        </select>
        <p className="text-xs leading-5 text-slate-500">Deny restrictions take precedence over ordinary role permissions.</p>
      </div>

      <fieldset className="grid gap-3 rounded-md border border-slate-200 p-4">
        <legend className="px-1 text-sm font-extrabold text-uiussc-charcoal">Scope <span className="text-red-700">*</span></legend>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="radio" name="scopeType" value="global" checked={scopeType === 'global'} disabled={!canUseGlobal} onChange={() => setScopeType('global')} />
          <span>Global access</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="radio" name="scopeType" value="department" checked={scopeType === 'department'} disabled={!canUseDepartment} onChange={() => setScopeType('department')} />
          <span>Department-scoped access</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="radio" name="scopeType" value="event" checked={scopeType === 'event'} disabled={!canUseEvent} onChange={() => setScopeType('event')} />
          <span>Event-scoped access</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-400">
          <input type="radio" disabled />
          <span>Record scope is disabled until an allowlisted resource picker exists.</span>
        </label>
      </fieldset>

      {scopeType === 'department' && (
        <div className="grid gap-2">
          <label htmlFor="departmentId" className="text-sm font-extrabold text-uiussc-charcoal">Department <span className="text-red-700">*</span></label>
          <select id="departmentId" name="departmentId" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" required>
            <option value="">Select department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
          </select>
        </div>
      )}

      {scopeType === 'event' && (
        <div className="grid gap-2">
          <label htmlFor="access-event-search" className="text-sm font-extrabold text-uiussc-charcoal">Event <span className="text-red-700">*</span></label>
          <input
            id="access-event-search"
            type="search"
            value={eventQuery}
            onChange={(event) => setEventQuery(event.target.value)}
            className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20"
            placeholder="Search by title, date, public status, or operational status"
          />
          <select id="eventId" name="eventId" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" required>
            <option value="">Select event</option>
            {filteredEvents.map((event) => (
              <option key={event.id} value={event.id}>{event.title} - {event.event_date} - public {event.status} - operation {event.operational_status ?? 'unknown'}</option>
            ))}
          </select>
        </div>
      )}

      {scopeType !== 'event' && <input type="hidden" name="eventId" value="" />}
      <input type="hidden" name="targetRecordType" value="" />
      <input type="hidden" name="targetRecordId" value="" />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="startsAt" className="text-sm font-extrabold text-uiussc-charcoal">Start date and time</label>
          <input id="startsAt" name="startsAt" type="datetime-local" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
          <p className="text-xs text-slate-500">Leave empty to start immediately.</p>
        </div>
        <div className="grid gap-2">
          <label htmlFor="expiresAt" className="text-sm font-extrabold text-uiussc-charcoal">Expiry date and time</label>
          <input id="expiresAt" name="expiresAt" type="datetime-local" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
          <p className="text-xs text-slate-500">Expiry must be after the start date.</p>
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="accessReason" className="text-sm font-extrabold text-uiussc-charcoal">Reason <span className="text-red-700">*</span></label>
        <textarea id="accessReason" name="reason" className="min-h-24 rounded-md border border-slate-200 p-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" required />
      </div>

      {state.message && (
        <p className={`text-sm font-bold ${state.status === 'error' ? 'text-red-700' : 'text-emerald-700'}`} role={state.status === 'error' ? 'alert' : 'status'} aria-live="polite">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="min-h-10 rounded-md bg-uiussc-orange px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#e85d00] disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? 'Working...' : 'Create temporary access'}
      </button>
    </form>
  )
}
