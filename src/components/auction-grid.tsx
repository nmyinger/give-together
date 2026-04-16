import { AuctionCard } from '@/components/auction-card'
import type { Auction } from '@/types/database'

interface AuctionGridProps {
  auctions: Auction[]
  title?: string
}

export function AuctionGrid({ auctions, title = 'Live Auctions' }: AuctionGridProps) {
  if (auctions.length === 0) {
    return (
      <section className="py-16 text-center">
        <p className="text-muted-foreground text-sm">No active auctions at the moment. Check back soon.</p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-5">
        <h2 className="font-display italic text-2xl text-foreground shrink-0">{title}</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-[var(--gold)]/30 to-transparent" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {auctions.map((auction) => (
          <AuctionCard key={auction.id} auction={auction} />
        ))}
      </div>
    </section>
  )
}
