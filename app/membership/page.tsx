import Container from '@/components/Container'
import PageHeader from '@/components/PageHeader'
import MembershipForm from '@/components/forms/MembershipForm'

export default function Membership(){
  return (
    <Container>
      <PageHeader
        title="Join UIUSSC"
        subtitle="Become part of a student-led social services community focused on volunteerism, leadership, and meaningful impact."
      />

      <section className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <MembershipForm />

        <aside className="h-fit rounded-xl bg-uiussc-navy p-6 text-white shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-200">Membership Note</p>
          <h2 className="mt-3 text-2xl font-extrabold">Serve, learn, and lead with UIUSSC.</h2>
          <p className="mt-4 text-sm leading-7 text-slate-200">
            Members support club events, campaign operations, volunteer coordination, and student engagement activities throughout the year.
          </p>
        </aside>
      </section>
    </Container>
  )
}
