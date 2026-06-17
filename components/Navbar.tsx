'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/events', label: 'Events' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/notices', label: 'Notices' },
  { href: '/membership', label: 'Membership' },
  { href: '/contact', label: 'Contact' }
]

export default function Navbar(){
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const menuId = 'primary-mobile-navigation'

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <header className="sticky top-0 z-40 overflow-x-clip border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-uiussc-navy text-sm font-bold text-white shadow-lg shadow-uiussc-navy/20">
            US
          </span>
          <span>
            <span className="block text-lg font-extrabold tracking-wide text-uiussc-navy">UIUSSC</span>
            <span className="hidden text-xs font-medium text-slate-500 sm:block">Serving Humanity, Building Community</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                isActive(item.href)
                  ? 'bg-uiussc-light text-uiussc-navy'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-uiussc-navy'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/membership" className="ml-2 rounded-md bg-uiussc-green px-4 py-2 text-sm font-bold text-white shadow-lg shadow-uiussc-green/20 transition hover:bg-[#238b40]">
            Join Us
          </Link>
        </nav>

        <div className="md:hidden">
          <button
            onClick={() => setOpen(!open)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-uiussc-navy transition hover:bg-uiussc-light"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label="Toggle navigation menu"
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>
      {open && (
        <div id={menuId} className="border-t border-slate-200 bg-white md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`rounded-md px-3 py-3 text-sm font-semibold ${
                  isActive(item.href)
                    ? 'bg-uiussc-light text-uiussc-navy'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/membership"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-md bg-uiussc-green px-4 py-3 text-center text-sm font-bold text-white"
            >
              Join Us
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
