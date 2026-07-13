import type { AdminActionState } from '@/features/admin/types'
import type { ClubPosition } from '@/features/admin/queries/getClubPositions'

type ClubPositionFieldsProps = {
  position?: ClubPosition
  includeStatus?: boolean
  state?: AdminActionState
}

export default function ClubPositionFields({ position, includeStatus, state }: ClubPositionFieldsProps){
  return (
    <div className="grid gap-4">
      <Field
        id={`position-name-${position?.id ?? 'new'}`}
        name="name"
        label="Position name"
        defaultValue={position?.name ?? ''}
        required
        error={state?.fieldErrors?.name?.[0]}
      />
      <Field
        id={`position-slug-${position?.id ?? 'new'}`}
        name="slug"
        label="Slug"
        defaultValue={position?.slug ?? ''}
        required
        helper="Use a short URL-safe value. The server normalizes it before saving."
        error={state?.fieldErrors?.slug?.[0]}
      />
      <TextareaField
        id={`position-description-${position?.id ?? 'new'}`}
        name="description"
        label="Description"
        defaultValue={position?.description ?? ''}
        error={state?.fieldErrors?.description?.[0]}
      />
      <NumberField
        id={`position-display-order-${position?.id ?? 'new'}`}
        name="displayOrder"
        label="Display order"
        defaultValue={position?.display_order ?? 0}
        min={0}
        required
        error={state?.fieldErrors?.displayOrder?.[0]}
      />
      <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
        <input name="isCorePanel" type="checkbox" defaultChecked={position?.is_core_panel ?? false} className="size-4 rounded border-slate-300 text-uiussc-orange focus:ring-uiussc-orange" />
        Core Panel position
      </label>
      {includeStatus && (
        <>
          <label className="grid gap-2 text-sm font-bold text-slate-700" htmlFor={`position-status-${position?.id ?? 'new'}`}>
            Status
            <select id={`position-status-${position?.id ?? 'new'}`} name="status" defaultValue={position?.status ?? 'active'} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900 focus:border-uiussc-orange focus:outline-none focus:ring-4 focus:ring-uiussc-orange/15">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <TextareaField id={`position-reason-${position?.id ?? 'new'}`} name="reason" label="Reason for change" error={state?.fieldErrors?.reason?.[0]} />
        </>
      )}
    </div>
  )
}

function Field({ id, name, label, defaultValue, required, helper, error }: {
  id: string
  name: string
  label: string
  defaultValue?: string
  required?: boolean
  helper?: string
  error?: string
}){
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-bold text-slate-700">{label}{required && <span className="text-uiussc-orange"> *</span>}</label>
      <input id={id} name={name} defaultValue={defaultValue} required={required} aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-uiussc-orange focus:outline-none focus:ring-4 focus:ring-uiussc-orange/15" />
      {helper && <p id={`${id}-helper`} className="text-xs leading-5 text-slate-500">{helper}</p>}
      {error && <p id={`${id}-error`} className="text-sm font-bold text-red-700">{error}</p>}
    </div>
  )
}

function NumberField({ id, name, label, defaultValue, min, required, error }: {
  id: string
  name: string
  label: string
  defaultValue: number
  min: number
  required?: boolean
  error?: string
}){
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-bold text-slate-700">{label}{required && <span className="text-uiussc-orange"> *</span>}</label>
      <input id={id} name={name} type="number" min={min} defaultValue={defaultValue} required={required} aria-describedby={error ? `${id}-error` : undefined} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-uiussc-orange focus:outline-none focus:ring-4 focus:ring-uiussc-orange/15" />
      {error && <p id={`${id}-error`} className="text-sm font-bold text-red-700">{error}</p>}
    </div>
  )
}

function TextareaField({ id, name, label, defaultValue, error }: {
  id: string
  name: string
  label: string
  defaultValue?: string
  error?: string
}){
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-bold text-slate-700">{label}</label>
      <textarea id={id} name={name} defaultValue={defaultValue} aria-describedby={error ? `${id}-error` : undefined} className="min-h-24 rounded-md border border-slate-200 p-3 text-sm focus:border-uiussc-orange focus:outline-none focus:ring-4 focus:ring-uiussc-orange/15" />
      {error && <p id={`${id}-error`} className="text-sm font-bold text-red-700">{error}</p>}
    </div>
  )
}
