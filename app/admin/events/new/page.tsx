import AdminActionForm from '@/components/admin/AdminActionForm'
import AdminHeader from '@/components/admin/AdminHeader'
import { createClubEventAction } from '@/features/event-operations/actions'

const categories = ['Blood Donation', 'Donation Drive', 'Campaign', 'Orientation', 'Workshop', 'Other']

export default function NewAdminEventPage(){
  return (
    <div>
      <AdminHeader title="Create event operation" description="Create a draft public event and its internal operation record in one controlled action." />
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <AdminActionForm
          action={createClubEventAction}
          submitLabel="Create draft event"
          fields={
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field id="title" label="Event title" required />
                <Field id="slug" label="Public slug" required />
              </div>
              <Field id="summary" label="Public summary" required />
              <TextArea id="description" label="Public description" required />
              <div className="grid gap-4 md:grid-cols-3">
                <label className="grid gap-2 text-sm font-bold text-uiussc-charcoal" htmlFor="category">
                  Category <span className="text-red-700">*</span>
                  <select id="category" name="category" required className="min-h-10 rounded-md border border-slate-200 px-3 py-2 font-normal text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20">
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
                <Field id="eventDate" label="Event date" type="date" required />
                <Field id="capacity" label="Capacity" type="number" />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field id="location" label="Location" required />
                <Field id="startTime" label="Start time" type="time" />
                <Field id="endTime" label="End time" type="time" />
              </div>
              <TextArea id="volunteerRequirements" label="Volunteer requirements" />
              <TextArea id="internalSummary" label="Internal planning note" />
            </div>
          }
        />
      </section>
    </div>
  )
}

function Field({ id, label, type = 'text', required = false }: { id: string; label: string; type?: string; required?: boolean }){
  return (
    <label className="grid gap-2 text-sm font-bold text-uiussc-charcoal" htmlFor={id}>
      {label} {required && <span className="text-red-700">*</span>}
      <input id={id} name={id} type={type} required={required} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 font-normal text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
    </label>
  )
}

function TextArea({ id, label, required = false }: { id: string; label: string; required?: boolean }){
  return (
    <label className="grid gap-2 text-sm font-bold text-uiussc-charcoal" htmlFor={id}>
      {label} {required && <span className="text-red-700">*</span>}
      <textarea id={id} name={id} required={required} className="min-h-24 rounded-md border border-slate-200 p-3 font-normal text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20" />
    </label>
  )
}
