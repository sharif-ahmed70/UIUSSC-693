import { NextRequest, NextResponse } from 'next/server'
import { getStaffAccessContext } from '@/features/staff/queries/getStaffAccessContext'
import { resolveStaffDestination } from '@/features/staff/routing/resolveStaffDestination'
import { safeRedirectPath } from '@/lib/auth/safeRedirect'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest){
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = safeRedirectPath(requestUrl.searchParams.get('next'), '/staff')

  if (!code) {
    return NextResponse.redirect(new URL('/login?message=invalid-link', requestUrl.origin))
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.warn('Auth callback failed', { code: error.code })
    return NextResponse.redirect(new URL('/login?message=invalid-link', requestUrl.origin))
  }

  if (next === '/reset-password') {
    return NextResponse.redirect(new URL('/reset-password', requestUrl.origin))
  }

  const access = await getStaffAccessContext()
  return NextResponse.redirect(new URL(resolveStaffDestination(access, next), requestUrl.origin))
}
