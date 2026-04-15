import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') ?? '/'

  if (code) {
    // Create the response upfront so the setAll closure can write cookies directly onto it.
    // If we create a new NextResponse.redirect() *after* exchangeCodeForSession, the session
    // cookies written during the exchange are lost — they were on a different object.
    const response = NextResponse.redirect(`${origin}${redirectTo}`)

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('[auth/callback] exchangeCodeForSession:', error ? `ERROR: ${error.message}` : 'OK')
    console.log('[auth/callback] Response cookies:', response.cookies.getAll().map(c => c.name))
    if (!error) {
      return response
    }
    console.error('[auth/callback] Full error:', error)
  }

  console.log('[auth/callback] No code or exchange failed, redirecting to login')
  // Auth failed — redirect to login with error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
