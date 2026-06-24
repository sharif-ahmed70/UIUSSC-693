import Link from 'next/link'
import type { ReactNode } from 'react'
import AdminActionForm from '@/components/admin/AdminActionForm'
import AdminHeader from '@/components/admin/AdminHeader'
import ClubPositionAssignmentActions from '@/components/admin/ClubPositionAssignmentActions'
import ClubPositionFields from '@/components/admin/ClubPositionFields'
import EmptyAdminState from '@/components/admin/EmptyAdminState'
import StatusBadge from '@/components/admin/StatusBadge'
import {
  archiveClubPositionAction,
  assignVolunteerClubPositionAction,
  createClubPositionAction,
  updateClubPositionAction,
} from '@/features/admin/actions/clubPositionActions'
import { getClubPositions, parseClubPositionSearchParams } from '@/features/admin/queries/getClubPositions'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ClubPositionsPage({ searchParams }: PageProps){
  const params = parseClubPositionSearchParams(await searchParams)
  const { positions, assignments, totalPositions, error } = await getClubPositions(params)
  const activePositions = positions.filter((position) => position.status === 'active').length
  const corePanelPositions = positions.filter((position) => position.is_core_panel).length
  const activeAssignments = assignments.filter((assignment) => assignment.status === 'active')
  const corePanelAssignments = activeAssignments.filter((assignment) => assignment.club_positions?.is_core_panel)
  const historicalAssignments = assignments.filter((assignment) => assignment.status !== 'active')
  const totalPages = Math.max(1, Math.ceil(totalPositions / params.pageSize))

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Club positions and Core Panel"
        description="Manage official UIUSSC leadership positions separately from website platform permissions and operational departments."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Active positions" value={activePositions} />
        <SummaryCard label="Core Panel positions" value={corePanelPositions} />
        <SummaryCard label="Active assignments" value={activeAssignments.length} />
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-uiussc-charcoal">Official Club Positions</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Manage UIUSSC leadership and Core Panel position definitions. Position titles are separate from website platform permissions and operational departments.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['active', 'inactive', 'archived', 'all'] as const).map((status) => (
              <Link
                key={status}
                href={`/admin/club-positions?status=${status}`}
                aria-current={params.status === status ? 'page' : undefined}
                className={`rounded-md px-3 py-2 text-sm font-extrabold capitalize transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20 ${params.status === status ? 'bg-uiussc-charcoal text-white' : 'border border-slate-200 text-slate-700 hover:border-uiussc-orange hover:text-uiussc-orange'}`}
              >
                {status}
              </Link>
            ))}
          </div>
        </div>

        {error && <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800" role="alert">Position catalogue is temporarily unavailable. Please try again after refreshing.</div>}

        <div className="mt-5 grid gap-4">
          {!error && positions.length === 0 ? (
            <EmptyAdminState message="No position definitions match this filter." />
          ) : positions.map((position) => (
            <article key={position.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-extrabold text-uiussc-charcoal">{position.name}</h3>
                  <p className="mt-1 break-all text-sm text-slate-600">/{position.slug}</p>
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                    <Meta label="Core Panel" value={position.is_core_panel ? 'Yes' : 'No'} />
                    <Meta label="Display order" value={String(position.display_order)} />
                    <Meta label="Status" value={<StatusBadge status={position.status} />} />
                  </dl>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{position.description ?? 'No description provided.'}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-md border border-slate-200 p-4">
                  <h4 className="mb-3 font-extrabold text-uiussc-charcoal">Edit position</h4>
                  <AdminActionForm action={updateClubPositionAction} id={position.id} submitLabel="Update position" fields={(state) => <ClubPositionFields position={position} includeStatus state={state} />} />
                </div>
                {position.status !== 'archived' && (
                  <div className="rounded-md border border-red-100 bg-red-50 p-4">
                    <h4 className="font-extrabold text-red-900">Archive position</h4>
                    <p className="mt-2 text-sm leading-6 text-red-800">Archive only when a position definition should no longer be assignable. Existing history remains preserved.</p>
                    <div className="mt-3">
                      <AdminActionForm action={archiveClubPositionAction} id={position.id} submitLabel="Archive position" danger fields={<LabeledTextarea id={`archive-reason-${position.id}`} name="reason" label="Archive reason" required />} />
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        {totalPages > 1 && (
          <nav className="mt-5 flex flex-wrap justify-end gap-2" aria-label="Position catalogue pagination">
            {params.page > 1 && <Link className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold" href={`/admin/club-positions?status=${params.status}&page=${params.page - 1}`}>Previous</Link>}
            <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">Page {params.page} of {totalPages}</span>
            {params.page < totalPages && <Link className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold" href={`/admin/club-positions?status=${params.status}&page=${params.page + 1}`}>Next</Link>}
          </nav>
        )}
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Create Position</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Add a new official club position definition. Slugs are normalized server-side and must remain unique.</p>
        <div className="mt-4">
          <AdminActionForm action={createClubPositionAction} submitLabel="Create position" fields={(state) => <ClubPositionFields state={state} />} />
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Assign Official Position</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">This does not grant platform permissions. Assign Club Admin or Super Admin separately from Platform Roles.</p>
        <div className="mt-4">
          <AdminActionForm action={assignVolunteerClubPositionAction} submitLabel="Assign position" fields={
            <div className="grid gap-4">
              <LabeledInput id="profileId" name="profileId" label="Approved volunteer profile UUID" required />
              <label className="grid gap-2 text-sm font-bold text-slate-700" htmlFor="positionId">
                Position
                <select id="positionId" name="positionId" className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900 focus:border-uiussc-orange focus:outline-none focus:ring-4 focus:ring-uiussc-orange/15" required>
                  <option value="">Select position</option>
                  {positions.filter((position) => position.status === 'active').map((position) => (
                    <option key={position.id} value={position.id}>{position.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input name="isPrimary" type="checkbox" defaultChecked className="size-4 rounded border-slate-300 text-uiussc-orange focus:ring-uiussc-orange" /> Primary position
              </label>
              <LabeledInput id="termStart" name="termStart" label="Term start date" type="date" />
              <LabeledTextarea id="assign-reason" name="reason" label="Assignment reason" />
            </div>
          } />
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Active Core Panel Assignments</h2>
        <div className="mt-4 grid gap-3">
          {corePanelAssignments.length === 0 ? <EmptyAdminState message="No active Core Panel assignments yet." /> : corePanelAssignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <h2 className="text-xl font-extrabold text-uiussc-charcoal">Position Assignments</h2>
        <div className="mt-4 grid gap-3">
          {assignments.length === 0 ? <EmptyAdminState message="No position assignments found." /> : assignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      </section>

      {historicalAssignments.length > 0 && (
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
          <h2 className="text-xl font-extrabold text-uiussc-charcoal">Historical Assignments</h2>
          <div className="mt-4 grid gap-3">
            {historicalAssignments.map((assignment) => <AssignmentCard key={assignment.id} assignment={assignment} />)}
          </div>
        </section>
      )}
    </div>
  )
}

type Assignment = Awaited<ReturnType<typeof getClubPositions>>['assignments'][number]

function AssignmentCard({ assignment }: { assignment: Assignment }){
  return (
    <article className="rounded-md border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-extrabold text-uiussc-charcoal">{assignment.volunteer_profiles?.full_name ?? 'Volunteer'}</h3>
          <p className="mt-1 text-sm text-slate-600">{assignment.club_positions?.name} - {assignment.is_primary ? 'Primary' : 'Secondary'}</p>
          <p className="mt-1 text-sm text-slate-600">Term: {assignment.term_start}{assignment.term_end ? ` to ${assignment.term_end}` : ' to present'}</p>
          <p className="mt-1 text-sm text-slate-600">Core Panel: {assignment.club_positions?.is_core_panel ? 'Yes' : 'No'}</p>
        </div>
        <StatusBadge status={assignment.status} />
      </div>
      <ClubPositionAssignmentActions assignmentId={assignment.id} isPrimary={assignment.is_primary} status={assignment.status} termStart={assignment.term_start} />
    </article>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }){
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-orange">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-uiussc-charcoal">{value}</p>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: ReactNode }){
  return <div><dt className="font-bold text-slate-500">{label}</dt><dd className="mt-1 text-slate-800">{value}</dd></div>
}

function LabeledInput({ id, name, label, type = 'text', required }: { id: string; name: string; label: string; type?: string; required?: boolean }){
  return (
    <label htmlFor={id} className="grid gap-2 text-sm font-bold text-slate-700">
      {label}{required && <span className="text-uiussc-orange"> *</span>}
      <input id={id} name={name} type={type} required={required} className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm font-normal text-slate-900 focus:border-uiussc-orange focus:outline-none focus:ring-4 focus:ring-uiussc-orange/15" />
    </label>
  )
}

function LabeledTextarea({ id, name, label, required }: { id: string; name: string; label: string; required?: boolean }){
  return (
    <label htmlFor={id} className="grid gap-2 text-sm font-bold text-slate-700">
      {label}{required && <span className="text-uiussc-orange"> *</span>}
      <textarea id={id} name={name} required={required} className="min-h-24 rounded-md border border-slate-200 p-3 text-sm font-normal text-slate-900 focus:border-uiussc-orange focus:outline-none focus:ring-4 focus:ring-uiussc-orange/15" />
    </label>
  )
}
