import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'My Bids — CharityBid',
}

export default async function MyBidsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) redirect('/auth/login?redirectTo=/account/bids')

  // Fetch user's bids with auction data, most recent first
  const { data: bids } = await supabase
    .from('bids')
    .select('*, auctions(id, slug, celebrity_name, celebrity_title, image_url, status, current_max_bid, winner_id, starting_price)')
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })
    .limit(100)

  // Deduplicate by auction: keep highest bid per auction for the "status" summary
  const auctionMap = new Map<string, typeof bids extends (infer T)[] | null ? T : never>()
  const allBids = bids ?? []

  // Group bids by auction for the summary cards
  const bidsByAuction = new Map<string, typeof allBids>()
  for (const bid of allBids) {
    if (!bid.auctions) continue
    const auctionId = bid.auctions.id
    if (!bidsByAuction.has(auctionId)) {
      bidsByAuction.set(auctionId, [])
      auctionMap.set(auctionId, bid)
    }
    bidsByAuction.get(auctionId)!.push(bid)
  }

  const auctionSummaries = Array.from(bidsByAuction.entries()).map(([auctionId, auctionBids]) => {
    const auction = auctionBids[0].auctions!
    const myHighest = Math.max(...auctionBids.map((b) => b.amount))
    const currentMax = auction.current_max_bid > 0 ? auction.current_max_bid : auction.starting_price
    const isWinner = auction.winner_id === authUser.id
    const isLeading = auction.status === 'active' && myHighest === currentMax
    const isOutbid = auction.status === 'active' && myHighest < currentMax
    const latestBid = auctionBids[0]
    return { auction, myHighest, currentMax, isWinner, isLeading, isOutbid, latestBid, bidCount: auctionBids.length }
  })

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display italic text-4xl text-foreground">My Bids</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {allBids.length === 0 ? 'No bids placed yet' : `${allBids.length} bid${allBids.length !== 1 ? 's' : ''} across ${auctionSummaries.length} auction${auctionSummaries.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/account"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-muted-foreground')}
        >
          ← Account
        </Link>
      </div>

      {allBids.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 rounded-xl border border-white/8 bg-card">
          <span className="text-4xl text-[var(--gold)]/20">◆</span>
          <div className="space-y-1">
            <p className="font-display italic text-xl text-foreground/60">No bids yet</p>
            <p className="text-sm text-muted-foreground">
              Browse live auctions and place your first bid.
            </p>
          </div>
          <Link
            href="/"
            className={cn(
              buttonVariants({ size: 'sm' }),
              'mt-2 bg-[var(--gold)] text-[oklch(0.11_0.010_255)] hover:bg-[var(--gold)]/90 font-bold'
            )}
          >
            View Live Auctions
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {auctionSummaries.map(({ auction, myHighest, currentMax, isWinner, isLeading, isOutbid, latestBid, bidCount }) => (
            <Link
              key={auction.id}
              href={`/auctions/${auction.slug}`}
              className="block rounded-xl border border-white/8 bg-card hover:border-[var(--gold)]/30 transition-colors overflow-hidden group"
            >
              <div className="p-4 flex items-center gap-4">
                {/* Status indicator */}
                <div className="shrink-0">
                  {isWinner && (
                    <div className="h-8 w-8 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                      <span className="text-green-400 text-xs font-bold">✓</span>
                    </div>
                  )}
                  {isLeading && (
                    <div className="h-8 w-8 rounded-full bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center">
                      <span className="text-[var(--gold)] text-xs">◆</span>
                    </div>
                  )}
                  {isOutbid && (
                    <div className="h-8 w-8 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                      <span className="text-red-400 text-xs font-bold">↑</span>
                    </div>
                  )}
                  {auction.status === 'closed' && !isWinner && (
                    <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <span className="text-muted-foreground/50 text-xs">—</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-[var(--gold)] transition-colors">
                        {auction.celebrity_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                        {auction.celebrity_title}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold tabular-nums text-[var(--gold)]">
                        {formatCurrency(myHighest)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        my highest
                      </p>
                    </div>
                  </div>

                  {/* Status row */}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isWinner && (
                        <span className="text-[10px] font-semibold text-green-400 border border-green-400/30 bg-green-400/8 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Won
                        </span>
                      )}
                      {isLeading && (
                        <span className="text-[10px] font-semibold text-[var(--gold)] border border-[var(--gold)]/30 bg-[var(--gold)]/8 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Leading
                        </span>
                      )}
                      {isOutbid && (
                        <span className="text-[10px] font-semibold text-red-400 border border-red-400/30 bg-red-400/8 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Outbid — {formatCurrency(currentMax)}
                        </span>
                      )}
                      {auction.status === 'closed' && !isWinner && (
                        <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wide">
                          Ended
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground/50 tabular-nums">
                      {bidCount} bid{bidCount !== 1 ? 's' : ''} · {formatRelativeTime(latestBid.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
