import AdminActionForm from '@/components/admin/AdminActionForm'
import AdminHeader from '@/components/admin/AdminHeader'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import StatusBadge from '@/components/admin/StatusBadge'
import {
  archiveClubPositionAction,
  assignVolunteerClubPositionAction,
  changePrimaryClubPositionAction,
  completeVolunteerClubPositionAction,
  createClubPositionAction,
  revokeVolunteerClubPositionAction,
  updateClubPositionAction,
} from '@/features/admin/actions/clubPositionActions'
import { getClubPositions } from '@/features/admin/queries/getClubPositions'

export default async function ClubPositionsPage(){
  const { positions, assignments } = await getClubPositions()
  const corePanel = assignments.filter((assignment) => assignment.status === 'active' && assignment.club_positions?.is_core_panel)

  return (
    <div>
      <AdminHeader
        title="Club positions and Core Panel"
        description="Manage official UIUSSC positions separately from platform permissions and department memberships."
      />

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Active Core Panel</h2>
        <div className="mt-4 grid gap-3">
          {corePanel.length === 0 ? <EmptyAdminState message="No active Core Panel assignments yet." /> : corePanel.map((assignment) => (
            <div key={assignment.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-uiussc-charcoal">{assignment.volunteer_profiles?.full_name ?? 'Volunteer'}</h3>
                  <p className="mt-1 text-sm text-slate-600">{assignment.club_positions?.name} - {assignment.is_primary ? 'Primary' : 'Secondary'}</p>
                  <p className="mt-1 text-sm text-slate-600">Term: {assignment.term_start}{assignment.term_end ? ` to ${assignment.term_end}` : ' to present'}</p>
                </div>
                <StatusBadge status={assignment.status} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Assign official position</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">This does not grant platform permissions. Assign `club_admin` or `super_admin` separately from Platform Roles.</p>
        <div className="mt-4">
          <AdminActionForm action={assignVolunteerClubPositionAction} submitLabel="Assign position" fields={
            <>
              <input name="profileId" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Approved volunteer profile UUID" required />
              <select name="positionId" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" required>
                <option value="">Select position</option>
                {positions.filter((position) => position.status === 'active').map((position) => (
                  <option key={position.id} value={position.id}>{position.name}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input name="isPrimary" type="checkbox" defaultChecked /> Primary position
              </label>
              <input name="termStart" type="date" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" />
              <textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm" placeholder="Reason" />
            </>
          } />
        </div>
      </section>

      <section className="mb-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Create position</h2>
        <div className="mt-4">
          <AdminActionForm action={createClubPositionAction} submitLabel="Create position" fields={<PositionFields />} />
        </div>
      </section>

      <section className="grid gap-4">
        {positions.length === 0 ? <EmptyAdminState /> : positions.map((position) => (
          <article key={position.id} className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-extrabold text-uiussc-charcoal">{position.name}</h2>
                <p className="mt-1 text-sm text-slate-600">/{position.slug} - Core Panel: {position.is_core_panel ? 'Yes' : 'No'} - order {position.display_order}</p>
                <p className="mt-2 text-sm text-slate-600">{position.description ?? 'No description'}</p>
              </div>
              <StatusBadge status={position.status} />
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <AdminActionForm action={updateClubPositionAction} id={position.id} submitLabel="Update position" fields={<PositionFields position={position} includeStatus />} />
              <AdminActionForm action={archiveClubPositionAction} id={position.id} submitLabel="Archive position" danger fields={<textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm" placeholder="Archive reason" required />} />
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Position assignments</h2>
        <div className="mt-4 grid gap-3">
          {assignments.length === 0 ? <EmptyAdminState message="No position assignments found." /> : assignments.map((assignment) => (
            <article key={assignment.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-uiussc-charcoal">{assignment.volunteer_profiles?.full_name ?? 'Volunteer'}</h3>
                  <p className="mt-1 text-sm text-slate-600">{assignment.club_positions?.name} - {assignment.is_primary ? 'Primary' : 'Secondary'}</p>
                  <p className="mt-1 text-sm text-slate-600">Term: {assignment.term_start}{assignment.term_end ? ` to ${assignment.term_end}` : ' to present'}</p>
                </div>
                <StatusBadge status={assignment.status} />
              </div>
              {assignment.status === 'active' && (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <AdminActionForm action={changePrimaryClubPositionAction} id={assignment.id} submitLabel="Make primary" fields={<textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm" placeholder="Reason" />} />
                  <AdminActionForm action={completeVolunteerClubPositionAction} id={assignment.id} submitLabel="Complete term" fields={<textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm" placeholder="Reason" />} />
                  <AdminActionForm action={revokeVolunteerClubPositionAction} id={assignment.id} submitLabel="Revoke position" danger fields={<textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm" placeholder="Reason" required />} />
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

type Position = Awaited<ReturnType<typeof getClubPositions>>['positions'][number]

function PositionFields({ position, includeStatus }: { position?: Position; includeStatus?: boolean }){
  return (
    <div className="grid gap-3">
      <input name="name" defaultValue={position?.name ?? ''} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Position name" required />
      <input name="slug" defaultValue={position?.slug ?? ''} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="position-slug" required />
      <textarea name="description" defaultValue={position?.description ?? ''} className="min-h-20 rounded-md border border-slate-200 p-3 text-sm" placeholder="Description" />
      <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
        <input name="isCorePanel" type="checkbox" defaultChecked={position?.is_core_panel ?? false} /> Core Panel position
      </label>
      <input name="displayOrder" type="number" min="0" defaultValue={position?.display_order ?? 0} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm" />
      {includeStatus && (
        <>
          <select name="status" defaultValue={position?.status ?? 'active'} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <textarea name="reason" className="min-h-20 rounded-md border border-slate-200 p-3 text-sm" placeholder="Reason for change" />
        </>
      )}
    </div>
  )
}
