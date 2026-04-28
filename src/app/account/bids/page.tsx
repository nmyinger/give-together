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

  const { data: bids } = await supabase
    .from('bids')
    .select('*, auctions(id, slug, celebrity_name, celebrity_title, image_url, status, current_max_bid, winner_id, starting_price)')
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const auctionMap = new Map<string, typeof bids extends (infer T)[] | null ? T : never>()
  const allBids = bids ?? []

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

  const auctionSummaries = Array.from(bidsByAuction.entries()).map(([, auctionBids]) => {
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Bid history</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {allBids.length === 0
              ? 'No bids placed yet'
              : `${allBids.length} bid${allBids.length !== 1 ? 's' : ''} across ${auctionSummaries.length} auction${auctionSummaries.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        <Link
          href="/account"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          ← Account
        </Link>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-border mb-6 gap-1">
        <Link
          href="/account"
          className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Settings
        </Link>
        <span className="px-4 py-2.5 text-sm font-semibold text-foreground border-b-2 border-foreground -mb-px">
          Bid history
        </span>
      </div>

      {allBids.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 rounded-2xl border border-border bg-card shadow-sm">
          <span className="text-4xl opacity-20">♦</span>
          <div className="space-y-1">
            <p className="font-display italic text-xl text-foreground/60">No bids yet</p>
            <p className="text-sm text-muted-foreground">
              Browse live auctions and place your first bid.
            </p>
          </div>
          <Link
            href="/"
            className={cn(buttonVariants({ size: 'sm' }), 'mt-2 shadow-sm font-semibold')}
          >
            View live auctions
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {auctionSummaries.map(({ auction, myHighest, currentMax, isWinner, isLeading, isOutbid, latestBid, bidCount }) => (
            <Link
              key={auction.id}
              href={`/auctions/${auction.slug}`}
              className="block rounded-xl border border-border bg-card hover:shadow-sm hover:border-primary/25 transition-all duration-200 overflow-hidden group"
            >
              <div className="p-4 flex items-center gap-4">
                {/* Status indicator */}
                <div className="shrink-0">
                  {isWinner && (
                    <div className="h-9 w-9 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                      <span className="text-green-700 text-sm font-bold">✓</span>
                    </div>
                  )}
                  {isLeading && (
                    <div className="h-9 w-9 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/25 flex items-center justify-center">
                      <span className="text-[var(--gold)] text-xs font-bold">↑</span>
                    </div>
                  )}
                  {isOutbid && (
                    <div className="h-9 w-9 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                      <span className="text-red-600 text-sm font-bold">↑</span>
                    </div>
                  )}
                  {auction.status === 'closed' && !isWinner && (
                    <div className="h-9 w-9 rounded-full bg-muted border border-border flex items-center justify-center">
                      <span className="text-muted-foreground text-xs">—</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
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
                      <p className="text-[10px] text-muted-foreground mt-0.5">my highest</p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {isWinner && (
                        <span className="text-[10px] font-semibold text-green-700 border border-green-200 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Won
                        </span>
                      )}
                      {isLeading && (
                        <span className="text-[10px] font-semibold text-[var(--gold)] border border-[var(--gold)]/30 bg-[var(--gold)]/8 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Leading
                        </span>
                      )}
                      {isOutbid && (
                        <span className="text-[10px] font-semibold text-red-700 border border-red-200 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Outbid — {formatCurrency(currentMax)}
                        </span>
                      )}
                      {auction.status === 'closed' && !isWinner && (
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          Ended
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground tabular-nums">
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
