import { AuctionCard } from '@/components/auction-card'
import type { Auction } from '@/types/database'

interface AuctionGridProps {
  auctions: Auction[]
  title?: string
}

export function AuctionGrid({ auctions, title = 'Live Auctions' }: AuctionGridProps) {
  if (auctions.length === 0) {
    return (
      <section className="py-12 text-center text-muted-foreground">
        No active auctions at the moment. Check back soon.
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {auctions.map((auction) => (
          <AuctionCard key={auction.id} auction={auction} />
        ))}
      </div>
    </section>
  )
}
