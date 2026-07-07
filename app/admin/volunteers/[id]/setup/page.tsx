import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdminActionForm from '@/components/admin/AdminActionForm'
import AdminHeader from '@/components/admin/AdminHeader'
import StaffSetupWizard from '@/components/admin/StaffSetupWizard'
import StatusBadge from '@/components/admin/StatusBadge'
import { rejectVolunteerAction, restoreVolunteerAction, suspendVolunteerAction } from '@/features/admin/actions/volunteerActions'
import { getStaffSetupData, maskEmail } from '@/features/staff-setup/queries'

type PageProps = { params: Promise<{ id: string }> }

export default async function StaffSetupPage({ params }: PageProps){
  const { id } = await params
  const data = await getStaffSetupData(id)
  if (!data.profile) notFound()

  const approved = data.profile.account_status === 'approved' && data.profile.onboarding_status === 'approved'
  const existingPositions = data.activePositions.map((item) => ({ label: 'Official position', value: item.club_positions?.name ?? 'Position' }))
  const existingWebsiteAccess = data.activePlatformRoles.map((item) => ({ label: 'Website access', value: formatWebsiteAccess(item.role) }))
  const existingDepartments = data.memberships.map((item) => ({ label: 'Department responsibility', value: `${item.club_departments?.name ?? 'Department'} - ${item.department_role.replaceAll('_', ' ')}` }))

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/volunteers/${id}`} className="mb-4 inline-flex text-sm font-bold text-uiussc-orange hover:text-[#e85d00]">Back to staff profile</Link>
        <AdminHeader title={approved ? 'Set up staff access' : 'Approve and set up'} description="Guided staff setup for office-bearers without UUIDs or internal permission jargon." />
      </div>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-orange">Step 1</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-uiussc-charcoal">Staff profile</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Review the person before assigning their responsibility and website access.</p>
          </div>
          <div className="flex flex-wrap gap-2"><StatusBadge status={data.profile.account_status} /><StatusBadge status={data.profile.onboarding_status} /></div>
        </div>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
          <Info label="Name" value={data.profile.full_name} />
          <Info label="Email" value={maskEmail(data.profile.email)} />
          <Info label="Student ID" value={data.profile.student_id ?? 'Not provided'} />
          <Info label="Academic department" value={data.profile.academic_department ?? 'Not provided'} />
          <Info label="Trimester" value={data.profile.trimester ?? 'Not provided'} />
          <Info label="Current approval status" value={`${data.profile.account_status.replaceAll('_', ' ')} / ${data.profile.onboarding_status.replaceAll('_', ' ')}`} />
        </dl>
        <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-bold text-uiussc-charcoal">{approved ? 'Continue to responsibility selection.' : 'This setup will approve the profile and continue.'}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Rejection and suspension are available under More actions for exceptional cases.</p>
        </div>
        <details className="mt-4 rounded-md border border-slate-200 p-4">
          <summary className="cursor-pointer text-sm font-extrabold text-uiussc-charcoal">More actions</summary>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <AdminActionForm action={rejectVolunteerAction} id={id} submitLabel="Reject profile" danger fields={<ReasonField />} />
            <AdminActionForm action={suspendVolunteerAction} id={id} submitLabel="Suspend profile" danger fields={<ReasonField />} />
            <AdminActionForm action={restoreVolunteerAction} id={id} submitLabel="Restore profile" fields={<ReasonField />} />
          </div>
        </details>
      </section>

      <StaffSetupWizard
        profileId={id}
        departments={data.departments.map((department) => ({ id: department.id, name: department.name, slug: department.slug }))}
        existingPositions={existingPositions}
        existingWebsiteAccess={existingWebsiteAccess}
        existingDepartments={existingDepartments}
      />
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }){
  return <div><dt className="font-bold text-slate-500">{label}</dt><dd className="mt-1 break-words text-slate-800">{value}</dd></div>
}

function ReasonField(){
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      Reason
      <textarea name="reason" className="min-h-24 rounded-md border border-slate-200 p-3" required />
    </label>
  )
}

function formatWebsiteAccess(role: string){
  return role.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}
