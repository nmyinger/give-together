import Link from 'next/link'
import Image from 'next/image'
import { buttonVariants } from '@/components/ui/button'
import { CountdownTimer } from '@/components/countdown-timer'
import { formatCurrency, cn } from '@/lib/utils'
import type { Auction } from '@/types/database'

interface FeaturedAuctionProps {
  auction: Auction
}

export function FeaturedAuction({ auction }: FeaturedAuctionProps) {
  const currentBid = auction.current_max_bid > 0 ? auction.current_max_bid : auction.starting_price

  return (
    <section className="relative rounded-2xl overflow-hidden border border-white/8 group">
      {/* Full-bleed image */}
      <div className="relative aspect-[16/7] min-h-[320px] md:min-h-[420px]">
        <Image
          src={auction.image_url}
          alt={auction.celebrity_name}
          fill
          priority
          className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 90vw"
        />

        {/* Atmospheric overlay — dark at bottom, transparent at top-center */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/60" />

        {/* Subtle gold corner accent */}
        <div className="absolute top-0 left-0 w-32 h-px bg-gradient-to-r from-[var(--gold)]/60 to-transparent" />
        <div className="absolute top-0 left-0 w-px h-32 bg-gradient-to-b from-[var(--gold)]/60 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-5 left-5 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-[var(--gold)]/50 bg-black/60 text-[var(--gold)] backdrop-blur-sm">
            <span className="text-[9px]">◆</span>
            Featured
          </span>
          {auction.status === 'active' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-green-400/40 bg-black/60 text-green-400 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          )}
        </div>

        {/* Bottom content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">

            {/* Left: identity */}
            <div className="space-y-1 max-w-lg">
              <p className="text-xs tracking-[0.2em] uppercase text-white/50 font-medium">
                {auction.celebrity_title}
              </p>
              <h1 className="font-display italic text-4xl md:text-5xl text-white leading-tight drop-shadow-2xl">
                {auction.celebrity_name}
              </h1>
              <p className="text-sm text-white/60 mt-2">
                100% of proceeds benefit{' '}
                <span className="text-white/90 font-medium">{auction.charity_name}</span>
              </p>
            </div>

            {/* Right: stats + CTA */}
            <div className="flex flex-col items-start md:items-end gap-4 shrink-0">
              {/* Bid stats row */}
              <div className="flex items-end gap-6">
                <div className="text-left md:text-right">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">
                    {auction.current_max_bid > 0 ? 'Current bid' : 'Starting bid'}
                  </p>
                  <p className="font-display text-3xl md:text-4xl text-[var(--gold)] tabular-nums leading-none"
                     style={{ textShadow: '0 0 40px oklch(0.73 0.130 82 / 0.4)' }}>
                    {formatCurrency(currentBid)}
                  </p>
                </div>

                {auction.status === 'active' && (
                  <div className="text-left md:text-right">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">
                      Ends in
                    </p>
                    <CountdownTimer endTime={auction.end_time} size="lg" />
                  </div>
                )}
              </div>

              {/* CTA */}
              <Link
                href={`/auctions/${auction.slug}`}
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'bg-[var(--gold)] text-[oklch(0.11_0.010_255)] hover:bg-[var(--gold)]/95 font-bold shadow-2xl shadow-[var(--gold)]/25 min-w-[180px] transition-all duration-200 hover:shadow-[var(--gold)]/40 hover:scale-[1.02]'
                )}
              >
                {auction.status === 'active' ? 'Place a Bid →' : 'View Auction'}
              </Link>
            </div>
          </div>

          {/* Bid count subtle info */}
          {auction.bid_count > 0 && (
            <p className="mt-3 text-xs text-white/30">
              {auction.bid_count} {auction.bid_count === 1 ? 'bid' : 'bids'} placed
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
