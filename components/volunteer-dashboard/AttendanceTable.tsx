'use client'

import { useMemo, useState, useActionState } from 'react'
import { submitVolunteerAttendanceAction, type VolunteerDashboardActionState } from '@/features/volunteer-dashboard/actions'
import type { VolunteerAttendanceMember } from '@/features/volunteer-dashboard/types'
import AttendanceRow, { type AttendanceDraft } from './AttendanceRow'

const initialState: VolunteerDashboardActionState = { status: 'idle' }
const pageSize = 25

export default function AttendanceTable({
  attendanceEventId,
  attendanceType,
  members,
  canManage,
  highlightMemberId,
}: {
  attendanceEventId: string | null
  attendanceType: 'meeting' | 'booth'
  members: VolunteerAttendanceMember[]
  canManage: boolean
  highlightMemberId?: string | null
}){
  const [state, formAction, isPending] = useActionState(submitVolunteerAttendanceAction, initialState)
  const [search, setSearch] = useState('')
  const [memberType, setMemberType] = useState('all')
  const [page, setPage] = useState(1)
  const [drafts, setDrafts] = useState<Record<string, AttendanceDraft>>(() => Object.fromEntries(members.map((member) => [
    member.volunteerProfileId,
    {
      memberId: member.volunteerProfileId,
      status: member.attendanceStatus,
      remarks: member.remarks ?? '',
      timeSlot: member.timeSlot ?? '',
    },
  ])))

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    return members.filter((member) => {
      const typeMatches = memberType === 'all' || member.memberType === memberType
      const searchMatches =
        !normalized ||
        member.fullName.toLowerCase().includes(normalized) ||
        String(member.serialNumber).includes(normalized) ||
        (member.studentId ?? '').toLowerCase().includes(normalized)

      return typeMatches && searchMatches
    })
  }, [members, memberType, search])

  const maxPage = Math.max(Math.ceil(filtered.length / pageSize), 1)
  const currentPage = Math.min(page, maxPage)
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const records = Object.values(drafts)

  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-lg shadow-slate-900/5">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-uiussc-orange">Attendance</p>
          <h2 className="mt-1 text-xl font-extrabold text-uiussc-charcoal">Member attendance table</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.currentTarget.value)
              setPage(1)
            }}
            placeholder="Search name, serial, student ID"
            className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20"
          />
          <select
            value={memberType}
            onChange={(event) => {
              setMemberType(event.currentTarget.value)
              setPage(1)
            }}
            className="min-h-10 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20"
          >
            <option value="all">All members</option>
            <option value="General">General</option>
            <option value="Panel">Panel</option>
          </select>
        </div>
      </div>

      {!attendanceEventId ? (
        <div className="p-6 text-sm font-bold text-slate-600">Select or create an attendance event to load members.</div>
      ) : (
        <form action={formAction}>
          <input type="hidden" name="eventId" value={attendanceEventId} />
          <input type="hidden" name="attendanceType" value={attendanceType} />
          <input type="hidden" name="records" value={JSON.stringify(records.map((record) => ({
            memberId: record.memberId,
            present: record.status === 'present',
            absent: record.status === 'absent',
            remarks: record.remarks,
            timeSlot: record.timeSlot,
          })))} />
          <div className="max-h-[38rem] overflow-auto">
            <table className="min-w-[1100px] w-full text-left">
              <thead className="sticky top-0 bg-slate-50 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Serial</th>
                  <th className="px-3 py-3">Picture</th>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Member ID / Student ID</th>
                  {attendanceType === 'booth' && <th className="px-3 py-3">Booth Time</th>}
                  <th className="px-3 py-3">Present</th>
                  <th className="px-3 py-3">Absent</th>
                  <th className="px-3 py-3">Remarks</th>
                  <th className="px-3 py-3">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((member) => (
                  <AttendanceRow
                    key={member.volunteerProfileId}
                    member={member}
                    canManage={canManage}
                    attendanceType={attendanceType}
                    highlight={highlightMemberId === member.volunteerProfileId}
                    draft={drafts[member.volunteerProfileId] ?? { memberId: member.volunteerProfileId, status: 'unmarked', remarks: '', timeSlot: '' }}
                    onChange={(draft) => setDrafts((current) => ({ ...current, [member.volunteerProfileId]: draft }))}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="sticky bottom-0 flex flex-col gap-3 border-t border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-600">Showing {visible.length} of {filtered.length} member(s). Page {currentPage} of {maxPage}.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(value - 1, 1))} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold disabled:opacity-50">Previous</button>
              <button type="button" disabled={currentPage === maxPage} onClick={() => setPage((value) => Math.min(value + 1, maxPage))} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-bold disabled:opacity-50">Next</button>
              {canManage && (
                <button type="submit" disabled={isPending} className="rounded-md bg-uiussc-orange px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#e85d00] disabled:opacity-60">
                  {isPending ? 'Saving...' : 'Save Attendance'}
                </button>
              )}
            </div>
          </div>
          {state.message && (
            <p className={`px-4 pb-4 text-sm font-bold ${state.status === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>{state.message}</p>
          )}
        </form>
      )}
    </section>
  )
}
