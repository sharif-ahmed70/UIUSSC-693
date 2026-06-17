import Link from 'next/link'
import React from 'react'

type Props = React.ComponentProps<'button'> & { href?: string; variant?: 'primary'|'secondary'|'ghost' }

export default function Button({ href, variant='primary', children, ...props }: Props){
  const base = 'inline-flex min-h-11 items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-uiussc-green/20'
  const styles = {
    primary: 'bg-uiussc-navy text-white shadow-lg shadow-uiussc-navy/15 hover:bg-[#071a33]',
    secondary: 'bg-uiussc-green text-white shadow-lg shadow-uiussc-green/20 hover:bg-[#238b40]',
    ghost: 'border border-slate-300 bg-white text-uiussc-navy hover:border-uiussc-green hover:bg-uiussc-light'
  }
  const cls = `${base} ${styles[variant]}`
  if(href) return <Link href={href} className={cls} {...props as any}>{children}</Link>
  return <button type="button" className={cls} {...props as any}>{children}</button>
}
