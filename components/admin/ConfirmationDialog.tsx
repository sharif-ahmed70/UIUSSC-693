import type { ReactNode } from 'react'

export default function ConfirmationDialog({ children }: { children: ReactNode }){
  return <div className="rounded-md border border-slate-200 bg-slate-50 p-4">{children}</div>
}
