import { createClient } from '@/lib/supabase/server'
import { FeaturedAuction } from '@/components/featured-auction'
import { AuctionSearch } from '@/components/auction-search'
import { HowItWorks } from '@/components/how-it-works'
import { StatsStrip } from '@/components/stats-strip'
import { RecentlyClosed } from '@/components/recently-closed'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: featured },
    { data: activeAuctions },
    { data: closedAuctions },
    { count: totalBids },
  ] = await Promise.all([
    supabase
      .from('auctions')
      .select('*')
      .eq('featured', true)
      .eq('status', 'active')
      .single(),
    supabase
      .from('auctions')
      .select('*')
      .eq('status', 'active')
      .order('end_time', { ascending: true }),
    supabase
      .from('auctions')
      .select('*')
      .eq('status', 'closed')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('bids')
      .select('*', { count: 'exact', head: true }),
  ])

  const otherAuctions = (activeAuctions ?? []).filter((a) => a.id !== featured?.id)

  const totalRaisedCents =
    (closedAuctions ?? []).reduce((sum, a) => sum + (a.current_max_bid || 0), 0) +
    (activeAuctions ?? []).reduce((sum, a) => sum + (a.current_max_bid > 0 ? a.current_max_bid : 0), 0)

  let watchedIds: string[] = []
  if (user) {
    const { data: watchlist } = await supabase
      .from('watchlist')
      .select('auction_id')
      .eq('user_id', user.id)
    watchedIds = (watchlist ?? []).map((w) => w.auction_id)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">

      {/* Platform stats */}
      <StatsStrip
        totalRaisedCents={totalRaisedCents}
        activeAuctions={(activeAuctions ?? []).length}
        totalBids={totalBids ?? 0}
      />

      {/* Featured auction */}
      {featured && <FeaturedAuction auction={featured} />}

      {/* Searchable auction grid */}
      <AuctionSearch
        auctions={otherAuctions}
        title={featured ? 'More Auctions' : 'Live Auctions'}
        isAuthenticated={!!user}
        watchedIds={watchedIds}
      />

      {/* Empty state */}
      {!featured && otherAuctions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 rounded-2xl border border-border bg-card shadow-sm">
          <span className="text-4xl text-[var(--gold)]/25">♦</span>
          <div className="space-y-1">
            <p className="font-display italic text-xl text-foreground/60">No live auctions</p>
            <p className="text-sm text-muted-foreground">
              New auctions are added regularly. Check back soon.
            </p>
          </div>
        </div>
      )}

      {/* Recently closed */}
      <RecentlyClosed auctions={closedAuctions ?? []} />

      {/* How it works */}
      <HowItWorks />
    </div>
  )
}
