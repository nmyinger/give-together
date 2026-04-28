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
    <section className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-300 group">
      <div className="grid grid-cols-1 lg:grid-cols-5">

        {/* Image — 3 of 5 columns */}
        <div className="relative aspect-[16/10] lg:aspect-auto lg:col-span-3 lg:min-h-[380px] overflow-hidden">
          <Image
            src={auction.image_url}
            alt={auction.celebrity_name}
            fill
            priority
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            sizes="(max-width: 1024px) 100vw, 60vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-[var(--gold)]/60 bg-black/50 text-[var(--gold)] backdrop-blur-sm">
              ♦ Featured
            </span>
            {auction.status === 'active' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-white/30 bg-black/50 text-white backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                Live
              </span>
            )}
          </div>

          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-[10px] tracking-[0.18em] uppercase text-white/60 font-medium mb-0.5">
              {auction.celebrity_title}
            </p>
            <h1 className="font-display italic text-3xl md:text-4xl text-white leading-tight drop-shadow-lg">
              {auction.celebrity_name}
            </h1>
          </div>
        </div>

        {/* Detail panel — 2 of 5 columns */}
        <div className="lg:col-span-2 p-6 lg:p-8 flex flex-col gap-6 justify-between">

          {/* Charity + description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Live auction</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              100% of proceeds benefit{' '}
              {auction.charity_website ? (
                <a
                  href={auction.charity_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-foreground underline underline-offset-2 hover:text-[var(--gold)] transition-colors"
                >
                  {auction.charity_name}
                </a>
              ) : (
                <span className="font-semibold text-foreground">{auction.charity_name}</span>
              )}
            </p>
          </div>

          {/* Bid stats card */}
          <div className="rounded-xl bg-muted p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                  {auction.current_max_bid > 0 ? 'Current bid' : 'Starting bid'}
                </p>
                <p className="font-display text-2xl lg:text-3xl text-[var(--gold)] tabular-nums leading-none">
                  {formatCurrency(currentBid)}
                </p>
              </div>
              {auction.status === 'active' && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                    Ends in
                  </p>
                  <CountdownTimer endTime={auction.end_time} size="lg" />
                </div>
              )}
            </div>

            {auction.bid_count > 0 && (
              <p className="text-xs text-muted-foreground border-t border-border pt-3">
                <span className="font-semibold text-foreground">{auction.bid_count}</span>{' '}
                {auction.bid_count === 1 ? 'bid' : 'bids'} placed so far
              </p>
            )}
          </div>

          {/* CTA */}
          <Link
            href={`/auctions/${auction.slug}`}
            className={cn(
              buttonVariants({ size: 'lg' }),
              'w-full font-semibold shadow-sm'
            )}
          >
            {auction.status === 'active' ? 'Place a bid →' : 'View auction'}
          </Link>
        </div>
      </div>
    </section>
  )
}
