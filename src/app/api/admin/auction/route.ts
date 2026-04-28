import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const {
    celebrity_name, celebrity_title, description,
    charity_name, charity_website, image_url,
    starting_price, min_increment, end_days, featured,
  } = body

  if (!celebrity_name || !celebrity_title || !description || !charity_name || !image_url) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const slug = celebrity_name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60) + '-' + Date.now().toString(36)

  const endTime = new Date(Date.now() + (end_days || 7) * 24 * 60 * 60 * 1000).toISOString()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('auctions')
    .insert({
      slug,
      celebrity_name,
      celebrity_title,
      description,
      charity_name,
      charity_website: charity_website || null,
      image_url,
      starting_price: starting_price || 10000,
      min_increment: min_increment || 1000,
      end_time: endTime,
      original_end_time: endTime,
      featured: !!featured,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, auction: data })
}
