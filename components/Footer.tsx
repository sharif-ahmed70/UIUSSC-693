import Link from 'next/link'

const quickLinks = [
  { href: '/about', label: 'About' },
  { href: '/events', label: 'Events' },
  { href: '/membership', label: 'Membership' },
  { href: '/contact', label: 'Contact' }
]

export default function Footer(){
  return (
    <footer className="mt-16 bg-uiussc-navy text-white">
      <div className="subtle-grid">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="grid gap-8 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-sm font-extrabold text-uiussc-navy">US</span>
                <div>
                  <h4 className="font-bold">United International University Social Services Club</h4>
                  <p className="text-sm text-slate-300">Serving Humanity, Building Community</p>
                </div>
              </div>
              <p className="mt-5 max-w-xl text-sm leading-6 text-slate-300">
                A student-led platform for volunteerism, awareness campaigns, donation drives, and meaningful social impact at UIU.
              </p>
            </div>

            <div>
              <h5 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-300">Quick Links</h5>
              <div className="mt-4 grid gap-2">
                {quickLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="text-sm text-slate-300 transition hover:text-white">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-300">Connect</h5>
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p>Facebook: UIUSSC</p>
                <p>Email: uiussc@example.edu</p>
                <p>UIU Campus, Dhaka</p>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-5 text-sm text-slate-400">
            Copyright {new Date().getFullYear()} UIUSSC. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
