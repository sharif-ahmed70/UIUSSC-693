import Link from 'next/link'

export default function MembershipCTA(){
  return (
    <section className="landing-section bg-uiussc-neutral">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="home-eyebrow">Ready to Make a Difference?</p>
        <h2 className="font-display mt-4 text-4xl font-bold leading-tight text-uiussc-charcoal md:text-5xl">Ready to Serve, Lead, and Make a Difference?</h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-uiussc-muted">
          Join UIUSSC and become part of a student community committed to meaningful social impact.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/membership" className="inline-flex min-h-12 items-center justify-center rounded-md bg-uiussc-orange px-6 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#e85d00]">Join UIUSSC</Link>
          <Link href="/membership" className="inline-flex min-h-12 items-center justify-center rounded-md border border-[rgba(21,19,18,0.16)] bg-white px-6 py-3 text-sm font-extrabold text-uiussc-charcoal transition hover:-translate-y-0.5 hover:border-uiussc-orange">Learn About Membership</Link>
        </div>
      </div>
    </section>
  )
}
