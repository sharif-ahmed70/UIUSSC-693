'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

type StaffAccessLinkProps = {
  className?: string
  onClick?: () => void
}

export default function StaffAccessLink({ className, onClick }: StaffAccessLinkProps){
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    let active = true

    supabase.auth.getUser().then(({ data }) => {
      if (active) {
        setIsAuthenticated(Boolean(data.user))
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user))
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <Link href={isAuthenticated ? '/staff' : '/login'} onClick={onClick} className={className}>
      {isAuthenticated ? 'Staff Dashboard' : 'Staff Login'}
    </Link>
  )
}
