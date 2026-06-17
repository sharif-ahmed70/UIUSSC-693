import Container from '@/components/Container'
import PageHeader from '@/components/PageHeader'
import Button from '@/components/Button'
import { contactCards } from '@/data/contact'

export default function Contact(){
  return (
    <Container>
      <PageHeader
        title="Contact UIUSSC"
        subtitle="Reach out for membership questions, collaborations, event support, and social service initiatives."
      />

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_420px]">
        <form className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input className="field" placeholder="Name" />
            <input className="field" placeholder="Email" type="email" />
            <input className="field md:col-span-2" placeholder="Subject" />
            <textarea className="field md:col-span-2" placeholder="Message" rows={6} />
          </div>
          <div className="mt-5">
            <Button type="button" variant="secondary">Send Message</Button>
          </div>
        </form>

        <div className="space-y-4">
          {contactCards.map((card) => (
            <article key={card.title} className="premium-card p-5">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-uiussc-green">{card.title}</p>
              <h2 className="mt-2 text-xl font-bold text-uiussc-navy">{card.detail}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.note}</p>
            </article>
          ))}

          <article className="rounded-xl bg-uiussc-navy p-6 text-white shadow-xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-200">Collaboration</p>
            <h2 className="mt-3 text-2xl font-extrabold">Partner with UIUSSC</h2>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              UIUSSC welcomes responsible collaborations for campaigns, donation drives, awareness programs, and student volunteer initiatives.
            </p>
          </article>
        </div>
      </section>
    </Container>
  )
}
