import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'
import { getSupabasePublicEnv } from './env'

export async function updateSupabaseSession(request: NextRequest){
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-uiussc-pathname', request.nextUrl.pathname)

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  const { supabaseUrl, supabasePublishableKey } = getSupabasePublicEnv()

  const supabase = createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll(){
        return request.cookies.getAll()
      },
      setAll(cookiesToSet){
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { error } = await supabase.auth.getClaims()
  const isStaffRoute = request.nextUrl.pathname === '/staff' || request.nextUrl.pathname.startsWith('/staff/')

  if (isStaffRoute && error) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.search = `next=${encodeURIComponent(request.nextUrl.pathname)}`
    return NextResponse.redirect(redirectUrl)
  }

  return response
}
