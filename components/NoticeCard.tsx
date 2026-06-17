import { Notice } from '@/types'

export default function NoticeCard({ notice }: { notice: Notice }){
  const isHigh = notice.priority.toLowerCase() === 'high'

  return (
    <article className={`relative overflow-hidden rounded-lg border bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl ${isHigh ? 'border-uiussc-green/35' : 'border-slate-200'}`}>
      {isHigh && <div className="absolute left-0 top-0 h-full w-1.5 bg-uiussc-green" />}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{notice.category}</p>
          <h3 className="mt-2 text-lg font-bold text-uiussc-navy">{notice.title}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${isHigh ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          {notice.priority}
        </span>
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-500">{notice.date}</div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{notice.summary}</p>
    </article>
  )
}
