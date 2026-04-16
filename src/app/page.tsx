import { createClient } from '@/lib/supabase/server'
import { FeaturedAuction } from '@/components/featured-auction'
import { AuctionGrid } from '@/components/auction-grid'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()

  const { data: featured } = await supabase
    .from('auctions')
    .select('*')
    .eq('featured', true)
    .eq('status', 'active')
    .single()

  const { data: auctions } = await supabase
    .from('auctions')
    .select('*')
    .eq('status', 'active')
    .order('end_time', { ascending: true })

  const otherAuctions = (auctions ?? []).filter((a) => a.id !== featured?.id)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-14">

      {/* Hero */}
      {featured && <FeaturedAuction auction={featured} />}

      {/* Auction grid */}
      <AuctionGrid
        auctions={otherAuctions}
        title={featured ? 'More Auctions' : 'Live Auctions'}
      />

      {/* Empty state if nothing at all */}
      {!featured && otherAuctions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <span className="text-4xl text-[var(--gold)]/20">◆</span>
          <div className="space-y-1">
            <p className="font-display italic text-xl text-foreground/60">No live auctions</p>
            <p className="text-sm text-muted-foreground">
              New auctions are added regularly. Check back soon.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
