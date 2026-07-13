import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import { canAccessDepartment } from '@/lib/auth/authorization'

type DepartmentFallbackPageProps = {
  params: Promise<{ slug: string }>
}

export default async function DepartmentFallbackPage({ params }: DepartmentFallbackPageProps){
  const { slug } = await params
  const access = await getStaffAccessContext()

  if (!canAccessDepartment(access, slug)) {
    notFound()
  }

  const membership = access.approvedMemberships.find((item) => item.department.slug === slug)

  return (
    <div className="rounded-md border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-uiussc-orange">Department Workspace</p>
      <h1 className="mt-3 text-3xl font-extrabold text-uiussc-charcoal">{membership?.department.name ?? 'Department'}</h1>
      <p className="mt-4 leading-7 text-slate-600">This department workspace is coming soon.</p>
      <Link href="/staff" className="mt-6 inline-flex rounded-md border border-slate-200 px-4 py-2 text-sm font-extrabold text-uiussc-charcoal transition hover:border-uiussc-orange hover:text-uiussc-orange">
        Back to staff dashboard
      </Link>
    </div>
  )
}
