type FilterBarProps = {
  action?: string
  statuses?: string[]
}

export default function FilterBar({ action, statuses = [] }: FilterBarProps){
  return (
    <form action={action} className="mb-5 grid gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5 md:grid-cols-[1fr_12rem_auto]">
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Search
        <input name="search" className="min-h-11 rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-uiussc-orange focus:ring-4 focus:ring-uiussc-orange/15" placeholder="Name, email, student ID" />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Status
        <select name="status" className="min-h-11 rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-uiussc-orange focus:ring-4 focus:ring-uiussc-orange/15">
          <option value="">All</option>
          {statuses.map((status) => (
            <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>
          ))}
        </select>
      </label>
      <button type="submit" className="min-h-11 self-end rounded-md bg-uiussc-orange px-5 py-2 text-sm font-extrabold text-white transition hover:bg-[#e85d00]">
        Filter
      </button>
    </form>
  )
}
