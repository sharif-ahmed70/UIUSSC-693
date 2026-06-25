import type { ReactNode } from 'react'

export default function ReasonDialog({ children }: { children: ReactNode }){
  return <div className="rounded-md border border-amber-200 bg-amber-50 p-4">{children}</div>
}
