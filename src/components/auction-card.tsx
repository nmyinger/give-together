import Link from 'next/link'
import Image from 'next/image'
import { CountdownTimer } from '@/components/countdown-timer'
import { formatCurrency } from '@/lib/utils'
import type { Auction } from '@/types/database'

interface AuctionCardProps {
  auction: Auction
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const currentBid = auction.current_max_bid > 0 ? auction.current_max_bid : auction.starting_price

  return (
    <Link href={`/auctions/${auction.slug}`} className="group block h-full">
      <article className="h-full rounded-xl border border-white/8 bg-card overflow-hidden transition-all duration-300 group-hover:border-[var(--gold)]/40 group-hover:shadow-[0_8px_32px_oklch(0.73_0.130_82_/_0.08)]">

        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={auction.image_url}
            alt={auction.celebrity_name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

          {auction.status === 'closed' && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <span className="text-xs font-semibold tracking-widest uppercase text-white/50 border border-white/20 px-3 py-1.5 rounded-full">
                Auction Ended
              </span>
            </div>
          )}

          {/* Live badge */}
          {auction.status === 'active' && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-green-400/30 bg-black/70 text-green-400 backdrop-blur-sm tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                Live
              </span>
            </div>
          )}

          {/* Name overlay at bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
            <h3 className="font-display italic text-xl text-white leading-tight drop-shadow-lg">
              {auction.celebrity_name}
            </h3>
            <p className="text-[10px] text-white/50 mt-0.5 tracking-widest uppercase">
              {auction.celebrity_title}
            </p>
          </div>
        </div>

        {/* Card body */}
        <div className="p-4 space-y-3.5">
          {/* Bid stats */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                {auction.current_max_bid > 0 ? 'Current bid' : 'Starting at'}
              </p>
              <p className="font-display text-2xl text-[var(--gold)] tabular-nums leading-none">
                {formatCurrency(currentBid)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                {auction.status === 'active' ? 'Ends in' : 'Ended'}
              </p>
              {auction.status === 'active' ? (
                <CountdownTimer endTime={auction.end_time} size="sm" />
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </div>

          {/* Footer row */}
          <div className="pt-3 border-t border-white/6 flex items-center justify-between">
            <p className="text-xs text-muted-foreground truncate mr-2">
              <span className="text-foreground/60">Benefits </span>
              <span className="text-foreground/80 font-medium">{auction.charity_name}</span>
            </p>
            {auction.bid_count > 0 && (
              <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                {auction.bid_count} bid{auction.bid_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
