'use client'

import { useRouter } from 'next/navigation'

export default function AttendanceTypeToggle({
  attendanceType,
  eventId,
}: {
  attendanceType: 'meeting' | 'booth'
  eventId: string | null
}){
  const router = useRouter()

  return (
    <fieldset className="rounded-md border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5">
      <legend className="text-sm font-extrabold text-uiussc-charcoal">Attendance Type</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          ['meeting', 'Meeting Attendance'],
          ['booth', 'Booth Attendance'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => router.push(`/staff/volunteer/dashboard?module=attendance&attendanceType=${value}${eventId ? `&eventId=${eventId}` : ''}`)}
            className={`rounded-md border px-4 py-2 text-sm font-extrabold transition ${
              attendanceType === value
                ? 'border-uiussc-orange bg-orange-50 text-uiussc-orange'
                : 'border-slate-200 text-slate-700 hover:border-uiussc-orange'
            }`}
            aria-pressed={attendanceType === value}
          >
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
