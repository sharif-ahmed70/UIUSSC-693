import { notFound } from 'next/navigation'
import AdminActionForm from '@/components/admin/AdminActionForm'
import AdminHeader from '@/components/admin/AdminHeader'
import StatusBadge from '@/components/admin/StatusBadge'
import { approveVolunteerAction, rejectVolunteerAction, restoreVolunteerAction, suspendVolunteerAction } from '@/features/admin/actions/volunteerActions'
import { getVolunteer } from '@/features/admin/queries/getVolunteer'

type PageProps = { params: Promise<{ id: string }> }

export default async function VolunteerDetailPage({ params }: PageProps){
  const { id } = await params
  const data = await getVolunteer(id)
  if (!data.profile) notFound()

  return (
    <div>
      <AdminHeader title={data.profile.full_name} description="Volunteer verification, status, department access, and role overview." />
      <section className="grid gap-5 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
            <div className="mb-4 flex flex-wrap gap-2">
              <StatusBadge status={data.profile.account_status} />
              <StatusBadge status={data.profile.onboarding_status} />
            </div>
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <Info label="Email" value={data.profile.email} />
              <Info label="Student ID" value={data.profile.student_id ?? 'Not provided'} />
              <Info label="Phone" value={data.profile.phone ?? 'Not provided'} />
              <Info label="Academic department" value={data.profile.academic_department ?? 'Not provided'} />
              <Info label="Trimester" value={data.profile.trimester ?? 'Not provided'} />
              <Info label="Blood group" value={data.profile.blood_group ?? 'Not provided'} />
            </dl>
          </div>
          <Panel title="Department memberships" items={data.memberships.map((item) => `${item.club_departments?.name ?? 'Department'} · ${item.department_role} · ${item.membership_status}${item.is_primary ? ' · primary' : ''}`)} />
          <Panel title="Platform roles" items={data.roles.map((item) => `${item.role} · ${item.status}`)} />
          <Panel title="Volunteer status history" items={data.statusHistory.map((item) => `${item.previous_status ?? 'new'} → ${item.new_status}${item.reason ? ` · ${item.reason}` : ''}`)} />
          <Panel title="Membership history" items={data.membershipHistory.map((item) => `${item.previous_status ?? 'new'} → ${item.new_status}`)} />
        </div>
        <div className="space-y-4">
          <AdminActionForm action={approveVolunteerAction} id={data.profile.id} submitLabel="Approve volunteer" fields={<ReasonField optional />} />
          <AdminActionForm action={rejectVolunteerAction} id={data.profile.id} submitLabel="Reject volunteer" danger fields={<ReasonField />} />
          <AdminActionForm action={suspendVolunteerAction} id={data.profile.id} submitLabel="Suspend volunteer" danger fields={<ReasonField />} />
          <AdminActionForm action={restoreVolunteerAction} id={data.profile.id} submitLabel="Restore volunteer" fields={<ReasonField />} />
        </div>
      </section>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }){
  return <div><dt className="font-bold text-slate-500">{label}</dt><dd className="mt-1 break-words text-slate-800">{value}</dd></div>
}

function ReasonField({ optional }: { optional?: boolean }){
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      Reason {optional && <span className="font-normal text-slate-500">(optional)</span>}
      <textarea name="reason" className="min-h-24 rounded-md border border-slate-200 p-3" required={!optional} />
    </label>
  )
}

function Panel({ title, items }: { title: string; items: string[] }){
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
      <h2 className="text-xl font-extrabold text-uiussc-charcoal">{title}</h2>
      <div className="mt-4 grid gap-2">
        {items.length === 0 ? <p className="text-sm text-slate-500">No records found.</p> : items.map((item) => <div key={item} className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">{item}</div>)}
      </div>
    </section>
  )
}
