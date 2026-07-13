import type { BoothAttendanceRecord } from '@/features/volunteer-dashboard/types'
import { formatDisplayDate } from '@/lib/date'

export default function BoothAttendanceRow({ records }: { records: BoothAttendanceRecord[] }){
  if(records.length === 0){
    return <p className="text-xs text-slate-500">No booth timeslot records yet.</p>
  }

  return (
    <div className="grid gap-2">
      {records.map((record) => (
        <div key={record.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-extrabold text-uiussc-charcoal">{record.location} / {record.timeslot}</p>
          <p className="mt-1 capitalize">Status: {record.status}</p>
          <p className="mt-1">Recorded: {formatDisplayDate(record.recordedAt)}</p>
          {record.remarks && <p className="mt-1">{record.remarks}</p>}
        </div>
      ))}
    </div>
  )
}
