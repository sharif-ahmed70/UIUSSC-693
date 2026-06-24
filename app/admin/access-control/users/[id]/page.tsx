import Link from 'next/link'
import AdminHeader from '@/components/admin/AdminHeader'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function AccessControlUserPage({ params }: PageProps){
  const { id } = await params

  return (
    <div>
      <AdminHeader title="User access detail" description="Detailed per-user access review will be expanded after the CM-4 permission foundation is accepted." />
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <p className="break-all text-sm text-slate-600">Volunteer profile reference: {id}</p>
        <p className="mt-3 text-sm leading-6 text-slate-600">Use the Access Control page to create or revoke scoped temporary permissions. Guided invitation-plan approval remains controlled by RPCs.</p>
        <Link href="/admin/access-control" className="mt-5 inline-flex rounded-md border border-slate-200 px-4 py-2 text-sm font-extrabold text-uiussc-charcoal transition hover:border-uiussc-orange hover:text-uiussc-orange">Back to access control</Link>
      </section>
    </div>
  )
}
