'use client'

import { useState } from 'react'
import SafeImage from '@/components/media/SafeImage'
import BoothAttendanceRow from './BoothAttendanceRow'
import type { VolunteerAttendanceMember } from '@/features/volunteer-dashboard/types'

export type AttendanceDraft = {
  memberId: string
  status: 'unmarked' | 'present' | 'absent'
  remarks: string
  timeSlot: string
}

export default function AttendanceRow({
  member,
  draft,
  canManage,
  attendanceType,
  highlight,
  onChange,
}: {
  member: VolunteerAttendanceMember
  draft: AttendanceDraft
  canManage: boolean
  attendanceType: 'meeting' | 'booth'
  highlight: boolean
  onChange: (draft: AttendanceDraft) => void
}){
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr id={`member-${member.volunteerProfileId}`} className={`border-b border-slate-100 align-top ${highlight ? 'bg-amber-50' : ''}`}>
        <td className="px-3 py-3 text-sm font-bold text-slate-600">{member.serialNumber}</td>
        <td className="px-3 py-3">
          <SafeImage src={member.pictureUrl} alt="" className="h-10 w-10 rounded-full" />
        </td>
        <td className="px-3 py-3">
          <p className="text-sm font-extrabold text-uiussc-charcoal">{member.fullName}</p>
          <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-1 text-xs font-bold text-uiussc-orange">
            {expanded ? 'Hide booth rows' : 'Booth rows'}
          </button>
        </td>
        <td className="px-3 py-3 text-sm text-slate-600">{member.studentId ?? 'Not set'}</td>
        {attendanceType === 'booth' && (
          <td className="px-3 py-3">
            <input
              value={draft.timeSlot}
              disabled={!canManage}
              onChange={(event) => onChange({ ...draft, timeSlot: event.currentTarget.value })}
              placeholder='["2026-07-09 10:00","2026-07-09 12:00")'
              className="min-h-10 w-64 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20 disabled:bg-slate-50"
              aria-label={`Booth time slot for ${member.fullName}`}
            />
          </td>
        )}
        <td className="px-3 py-3">
          <input
            type="checkbox"
            checked={draft.status === 'present'}
            disabled={!canManage}
            onChange={(event) => onChange({ ...draft, status: event.currentTarget.checked ? 'present' : 'unmarked' })}
            aria-label={`Mark ${member.fullName} present`}
            className="h-5 w-5 rounded border-slate-300 text-uiussc-green focus:ring-uiussc-green"
          />
        </td>
        <td className="px-3 py-3">
          <input
            type="checkbox"
            checked={draft.status === 'absent'}
            disabled={!canManage}
            onChange={(event) => onChange({ ...draft, status: event.currentTarget.checked ? 'absent' : 'unmarked' })}
            aria-label={`Mark ${member.fullName} absent`}
            className="h-5 w-5 rounded border-slate-300 text-uiussc-orange focus:ring-uiussc-orange"
          />
        </td>
        <td className="px-3 py-3">
          <input
            value={draft.remarks}
            disabled={!canManage}
            onChange={(event) => onChange({ ...draft, remarks: event.currentTarget.value })}
            placeholder="Remarks"
            className="min-h-10 w-52 rounded-md border border-slate-200 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/20 disabled:bg-slate-50"
            aria-label={`Remarks for ${member.fullName}`}
          />
        </td>
        <td className="px-3 py-3 text-xs font-semibold text-slate-500">{member.updatedAt ? new Date(member.updatedAt).toLocaleString() : 'Not updated'}</td>
      </tr>
      {expanded && (
        <tr className="border-b border-slate-100 bg-slate-50">
          <td colSpan={attendanceType === 'booth' ? 9 : 8} className="px-3 py-3">
            <BoothAttendanceRow records={member.boothRecords} />
          </td>
        </tr>
      )}
    </>
  )
}
