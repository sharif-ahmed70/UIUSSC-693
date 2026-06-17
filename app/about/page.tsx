import Container from '@/components/Container'
import PageHeader from '@/components/PageHeader'
import SectionHeader from '@/components/SectionHeader'
import { executivePanel, values, whatWeDo } from '@/data/about'

export default function About(){
  return (
    <Container>
      <PageHeader
        title="About United International University Social Services Club"
        subtitle="UIUSSC is a student-led organization focused on social welfare, volunteer mobilization, awareness campaigns, and responsible community service."
      />

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {values.map((item) => (
          <article key={item.title} className="premium-card p-6">
            <h2 className="text-xl font-bold text-uiussc-navy">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{item.summary}</p>
          </article>
        ))}
      </section>

      <section className="py-14">
        <SectionHeader title="What We Do" subtitle="UIUSSC organizes practical service programs that help students contribute with discipline, empathy, and teamwork." />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          {whatWeDo.map((item) => (
            <article key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-5 h-12 w-12 rounded-md bg-uiussc-light ring-1 ring-slate-200" />
              <h3 className="text-lg font-bold text-uiussc-navy">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pb-8">
        <SectionHeader title="Executive Panel" subtitle="A structured leadership group guides club planning, member coordination, and program execution." />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          {executivePanel.map((role) => (
            <article key={role} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="h-36 bg-gradient-to-br from-slate-100 via-emerald-50 to-slate-200" />
              <div className="p-5">
                <h3 className="font-bold text-uiussc-navy">{role}</h3>
                <p className="mt-2 text-sm text-slate-500">Executive member placeholder</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Container>
  )
}
