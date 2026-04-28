import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // Verify caller is an admin via session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!caller?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, isAdmin } = await request.json().catch(() => ({}))
  if (!userId || typeof isAdmin !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Prevent self-demotion
  if (userId === user.id && !isAdmin) {
    return NextResponse.json({ error: 'Cannot remove your own admin access' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient.from('users').update({ is_admin: isAdmin }).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
