import { createClient } from '@/lib/supabase/server'
import { FeaturedAuction } from '@/components/featured-auction'
import { AuctionGrid } from '@/components/auction-grid'

export const revalidate = 60 // revalidate every 60s

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch featured auction
  const { data: featured } = await supabase
    .from('auctions')
    .select('*')
    .eq('featured', true)
    .eq('status', 'active')
    .single()

  // Fetch all active auctions (excluding the featured one)
  const { data: auctions } = await supabase
    .from('auctions')
    .select('*')
    .eq('status', 'active')
    .order('end_time', { ascending: true })

  const otherAuctions = (auctions ?? []).filter((a) => a.id !== featured?.id)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      {featured && <FeaturedAuction auction={featured} />}
      <AuctionGrid
        auctions={otherAuctions}
        title={featured ? 'More Auctions' : 'Live Auctions'}
      />
    </div>
  )
}
