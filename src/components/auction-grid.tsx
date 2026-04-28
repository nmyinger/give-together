import { AuctionCard } from '@/components/auction-card'
import type { Auction } from '@/types/database'

interface AuctionGridProps {
  auctions: Auction[]
  title?: string
  isAuthenticated?: boolean
  watchedIds?: string[]
}

export function AuctionGrid({ auctions, title = 'Live Auctions', isAuthenticated = false, watchedIds = [] }: AuctionGridProps) {
  if (auctions.length === 0) {
    return (
      <section className="py-16 text-center">
        <p className="text-muted-foreground text-sm">No active auctions at the moment. Check back soon.</p>
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="font-display italic text-xl text-foreground">{title}</h2>
          <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums">
            {auctions.length}
          </span>
        </div>
        <div className="flex-1 h-px bg-border max-w-xs hidden sm:block" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {auctions.map((auction) => (
          <AuctionCard
            key={auction.id}
            auction={auction}
            isAuthenticated={isAuthenticated}
            isWatched={watchedIds.includes(auction.id)}
          />
        ))}
      </div>
    </section>
  )
}
