import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Demo seed endpoint — creates sample auctions for presentations/demos.
// Protected by ADMIN_SECRET env var.
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Clear existing auctions and bids for a clean demo
  await supabase.from('bids').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('auctions').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const now = new Date()
  const endTime1 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days
  const endTime2 = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString() // 4 days
  const endTime3 = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString() // 6 days
  const endTimeLive = new Date(now.getTime() + 7 * 60 * 1000).toISOString() // 7 minutes (for demo)

  const { error } = await supabase.from('auctions').insert([
    {
      slug: 'dinner-with-naval-ravikant',
      celebrity_name: 'Naval Ravikant',
      celebrity_title: 'Entrepreneur & Philosopher',
      description:
        'An intimate dinner with Naval Ravikant — entrepreneur, investor, and one of the most original thinkers in Silicon Valley. Spend an evening discussing startups, wealth, happiness, and the nature of reality. Limited to you and two guests. Venue: San Francisco, date to be coordinated.',
      charity_name: 'GiveDirectly',
      charity_website: 'https://givedirectly.org',
      image_url:
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
      starting_price: 500000,
      min_increment: 25000,
      end_time: endTimeLive,
      original_end_time: endTimeLive,
      featured: true,
      status: 'active',
      current_max_bid: 0,
      bid_count: 0,
    },
    {
      slug: 'coaching-with-alex-hormozi',
      celebrity_name: 'Alex Hormozi',
      celebrity_title: 'Founder of Acquisition.com',
      description:
        'A 90-minute private strategy session with Alex Hormozi. Bring your biggest business challenge. Walk away with a concrete action plan from the person who built four businesses to $100M+ combined. Video call, fully recorded for your reference.',
      charity_name: 'Pencils of Promise',
      charity_website: 'https://pencilsofpromise.org',
      image_url:
        'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&q=80',
      starting_price: 250000,
      min_increment: 10000,
      end_time: endTime1,
      original_end_time: endTime1,
      featured: false,
      status: 'active',
      current_max_bid: 0,
      bid_count: 0,
    },
    {
      slug: 'coffee-with-sara-blakely',
      celebrity_name: 'Sara Blakely',
      celebrity_title: 'Founder of Spanx',
      description:
        'A one-hour virtual coffee with Sara Blakely — the first self-made female billionaire in the US. Ask her anything about entrepreneurship, building a brand from zero, breaking into competitive markets, or the lessons she learned before Spanx was a household name.',
      charity_name: 'Sara Blakely Foundation',
      charity_website: 'https://sarablakely.com/foundation',
      image_url:
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
      starting_price: 100000,
      min_increment: 5000,
      end_time: endTime2,
      original_end_time: endTime2,
      featured: false,
      status: 'active',
      current_max_bid: 0,
      bid_count: 0,
    },
    {
      slug: 'fireside-with-patrick-collison',
      celebrity_name: 'Patrick Collison',
      celebrity_title: 'CEO of Stripe',
      description:
        'A private one-hour fireside conversation with Patrick Collison, co-founder and CEO of Stripe. Topics can include the future of payments, building world-class engineering culture, or his work accelerating scientific research through Arc Institute. Your agenda, his candor.',
      charity_name: 'Arc Institute',
      charity_website: 'https://arcinstitute.org',
      image_url:
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&q=80',
      starting_price: 300000,
      min_increment: 15000,
      end_time: endTime3,
      original_end_time: endTime3,
      featured: false,
      status: 'active',
      current_max_bid: 0,
      bid_count: 0,
    },
  ])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Demo auctions seeded successfully' })
}
