'use client'

import { useState } from 'react'

const evidenceTypes = ['document', 'design', 'spreadsheet', 'presentation', 'photo', 'video', 'folder', 'other']
const maxLinks = 10

export default function EvidenceLinkFields(){
  const [rows, setRows] = useState([{ id: crypto.randomUUID() }])

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-extrabold text-uiussc-charcoal">Evidence links</h3>
        <button
          type="button"
          disabled={rows.length >= maxLinks}
          onClick={() => setRows((current) => [...current, { id: crypto.randomUUID() }])}
          className="rounded-md border border-slate-200 px-3 py-2 text-xs font-extrabold text-uiussc-charcoal transition hover:border-uiussc-orange hover:text-uiussc-orange disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add link
        </button>
      </div>

      {rows.map((row, index) => (
        <fieldset key={row.id} className="grid gap-3 rounded-md border border-slate-200 p-3">
          <legend className="px-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Evidence {index + 1}</legend>
          <label htmlFor={`evidenceType-${row.id}`} className="grid gap-2 text-sm font-bold text-uiussc-charcoal">
            Type
            <select id={`evidenceType-${row.id}`} name="evidenceType" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 font-normal text-slate-700">
              {evidenceTypes.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
            </select>
          </label>
          <label htmlFor={`evidenceLabel-${row.id}`} className="grid gap-2 text-sm font-bold text-uiussc-charcoal">
            Label
            <input id={`evidenceLabel-${row.id}`} name="evidenceLabel" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 font-normal text-slate-700" />
          </label>
          <label htmlFor={`evidenceUrl-${row.id}`} className="grid gap-2 text-sm font-bold text-uiussc-charcoal">
            HTTPS URL
            <input id={`evidenceUrl-${row.id}`} name="evidenceUrl" type="url" inputMode="url" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 font-normal text-slate-700" />
          </label>
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
              className="justify-self-start rounded-md border border-red-200 px-3 py-2 text-xs font-extrabold text-red-700 transition hover:bg-red-50"
            >
              Remove link
            </button>
          )}
        </fieldset>
      ))}
      <p className="text-xs leading-5 text-slate-500">Use shareable HTTPS links only. Do not paste links containing passwords, tokens, or private keys.</p>
    </div>
  )
}
