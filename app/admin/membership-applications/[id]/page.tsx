import { notFound } from 'next/navigation'
import AdminActionForm from '@/components/admin/AdminActionForm'
import AdminHeader from '@/components/admin/AdminHeader'
import StatusBadge from '@/components/admin/StatusBadge'
import { reviewMembershipApplicationAction } from '@/features/admin/actions/reviewMembershipApplication'
import { getMembershipApplication } from '@/features/admin/queries/getMembershipApplication'

type PageProps = { params: Promise<{ id: string }> }

export default async function MembershipApplicationDetailPage({ params }: PageProps){
  const { id } = await params
  const { application, history } = await getMembershipApplication(id)
  if (!application) notFound()

  return (
    <div>
      <AdminHeader title={application.full_name} description="Membership application review. Account invitation remains pending until a secure invitation workflow is configured." />
      <section className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <div className="mb-4"><StatusBadge status={application.status} /></div>
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <Info label="Student ID" value={application.student_id} />
            <Info label="Email" value={application.email} />
            <Info label="Phone" value={application.phone} />
            <Info label="Academic department" value={application.department} />
            <Info label="Trimester" value={application.trimester} />
            <Info label="Interested department" value={application.interested_department} />
            <Info label="Skills" value={application.skills ?? 'Not provided'} />
            <Info label="Invitation state" value={application.status === 'approved' ? 'Account invitation is not yet configured.' : 'Not ready'} />
          </dl>
          <h2 className="mt-6 font-extrabold text-uiussc-charcoal">Motivation</h2>
          <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-600">{application.motivation}</p>
        </div>
        <div className="space-y-4">
          {['approved', 'rejected', 'waitlisted', 'withdrawn'].map((status) => (
            <AdminActionForm key={status} action={reviewMembershipApplicationAction} id={application.id} submitLabel={`Mark ${status}`} danger={status === 'rejected'} fields={
              <>
                <input type="hidden" name="status" value={status} />
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Reason
                  <textarea name="reason" className="min-h-24 rounded-md border border-slate-200 p-3" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Admin notes
                  <textarea name="adminNotes" className="min-h-24 rounded-md border border-slate-200 p-3" />
                </label>
              </>
            } />
          ))}
        </div>
      </section>
      <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Status history</h2>
        <div className="mt-4 grid gap-3">
          {history.length === 0 ? <p className="text-sm text-slate-500">No status history yet.</p> : history.map((item) => (
            <div key={item.id} className="rounded-md border border-slate-200 px-4 py-3 text-sm text-slate-700">{item.previous_status ?? 'new'} → {item.new_status}</div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }){
  return <div><dt className="font-bold text-slate-500">{label}</dt><dd className="mt-1 break-words text-slate-800">{value}</dd></div>
}
