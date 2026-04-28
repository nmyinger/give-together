import Link from 'next/link'
import Image from 'next/image'
import { CountdownTimer } from '@/components/countdown-timer'
import { WatchButton } from '@/components/watch-button'
import { formatCurrency } from '@/lib/utils'
import type { Auction } from '@/types/database'

interface AuctionCardProps {
  auction: Auction
  isAuthenticated?: boolean
  isWatched?: boolean
}

export function AuctionCard({ auction, isAuthenticated = false, isWatched = false }: AuctionCardProps) {
  const currentBid = auction.current_max_bid > 0 ? auction.current_max_bid : auction.starting_price

  return (
    <Link href={`/auctions/${auction.slug}`} className="group block h-full">
      <article className="h-full rounded-xl border border-border bg-card overflow-hidden shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-0.5">

        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={auction.image_url}
            alt={auction.celebrity_name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

          {auction.status === 'closed' && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
              <span className="text-xs font-semibold tracking-widest uppercase text-white/70 border border-white/25 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm">
                Ended
              </span>
            </div>
          )}

          {/* Top row: live badge + watch */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            {auction.status === 'active' ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold border border-white/25 bg-black/55 text-white backdrop-blur-sm tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                Live
              </span>
            ) : <span />}
            <WatchButton
              auctionId={auction.id}
              initialWatched={isWatched}
              isAuthenticated={isAuthenticated}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            />
          </div>

          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3.5">
            <h3 className="font-display italic text-[1.15rem] text-white leading-tight drop-shadow-lg">
              {auction.celebrity_name}
            </h3>
            <p className="text-[10px] text-white/55 mt-0.5 tracking-widest uppercase">
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
              <p className="font-display text-xl text-[var(--gold)] tabular-nums leading-none">
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
          <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
            <div className="min-w-0">
              {auction.charity_website ? (
                <a
                  href={auction.charity_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate block"
                >
                  <span className="text-foreground/50">Benefits </span>
                  <span className="font-medium text-foreground/70 hover:text-foreground underline underline-offset-2">
                    {auction.charity_name}
                  </span>
                </a>
              ) : (
                <p className="text-xs text-muted-foreground truncate">
                  <span className="text-foreground/50">Benefits </span>
                  <span className="font-medium text-foreground/70">{auction.charity_name}</span>
                </p>
              )}
            </div>
            {auction.bid_count > 0 && (
              <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums bg-muted px-1.5 py-0.5 rounded-md">
                {auction.bid_count} bid{auction.bid_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
