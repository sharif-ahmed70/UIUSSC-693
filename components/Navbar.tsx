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
    <header className="sticky top-0 z-40 overflow-x-clip border-b border-white/10 bg-uiussc-charcoal/95 text-white shadow-lg shadow-black/10 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-orange/30" onClick={() => setOpen(false)}>
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-uiussc-orange text-sm font-bold text-white shadow-lg shadow-uiussc-orange/20">
            US
          </span>
          <span>
            <span className="block text-lg font-extrabold tracking-wide text-white">UIUSSC</span>
            <span className="hidden text-xs font-medium text-white/65 sm:block">Serving Humanity, Building Community</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`relative rounded-md px-3 py-2 text-sm font-semibold transition after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-left after:rounded-full after:bg-uiussc-orange after:transition ${
                isActive(item.href)
                  ? 'text-white after:scale-x-100'
                  : 'text-white/72 after:scale-x-0 hover:text-white hover:after:scale-x-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/membership" className="ml-2 rounded-md bg-uiussc-orange px-4 py-2 text-sm font-bold text-white shadow-lg shadow-uiussc-orange/20 transition hover:bg-[#e85d00]">
            Join UIUSSC
          </Link>
        </nav>

        <div className="md:hidden">
          <button
            onClick={() => setOpen(!open)}
            className="rounded-md border border-white/20 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label="Toggle navigation menu"
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>
      {open && (
        <div id={menuId} className="border-t border-white/10 bg-uiussc-charcoal md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`rounded-md px-3 py-3 text-sm font-semibold ${
                  isActive(item.href)
                    ? 'bg-white/10 text-white'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/membership"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-md bg-uiussc-orange px-4 py-3 text-center text-sm font-bold text-white"
            >
              Join UIUSSC
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
