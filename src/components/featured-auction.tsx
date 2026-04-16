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
    <section className="rounded-2xl overflow-hidden border border-white/8 grid grid-cols-1 md:grid-cols-5">

      {/* Left: image — clean, no text on top */}
      <div className="relative md:col-span-3 aspect-[4/3] md:aspect-auto min-h-[240px]">
        <Image
          src={auction.image_url}
          alt={auction.celebrity_name}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 60vw"
        />
      </div>

      {/* Right: content panel — always readable */}
      <div className="md:col-span-2 bg-card flex flex-col justify-between p-7 md:p-8 gap-6">

        {/* Top: labels + name */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]">
              <span className="text-[10px]">◆</span>
              Featured
            </span>
            {auction.status === 'active' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-green-400/30 bg-green-400/10 text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                Live
              </span>
            )}
          </div>

          <div>
            <h1 className="font-display italic text-3xl md:text-4xl text-foreground leading-tight">
              {auction.celebrity_name}
            </h1>
            <p className="text-muted-foreground mt-1.5 text-xs tracking-widest uppercase">
              {auction.celebrity_title}
            </p>
          </div>
        </div>

        {/* Middle: bid stats */}
        <div className="space-y-4">
          <div className="h-px bg-white/8" />

          <div className="flex items-end gap-8">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                {auction.current_max_bid > 0 ? 'Current bid' : 'Starting bid'}
              </p>
              <p className="font-display text-4xl text-[var(--gold)] tabular-nums leading-none">
                {formatCurrency(currentBid)}
              </p>
            </div>

            {auction.status === 'active' && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">
                  Ends in
                </p>
                <CountdownTimer endTime={auction.end_time} size="lg" />
              </div>
            )}
          </div>

          <div className="h-px bg-white/8" />
        </div>

        {/* Bottom: charity + CTA */}
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            100% of proceeds benefit{' '}
            <span className="text-foreground font-medium">{auction.charity_name}</span>
          </p>

          <Link
            href={`/auctions/${auction.slug}`}
            className={cn(
              buttonVariants({ size: 'lg' }),
              'w-full bg-[var(--gold)] text-[oklch(0.11_0.010_255)] hover:bg-[var(--gold)]/90 font-semibold shadow-lg shadow-[var(--gold)]/15'
            )}
          >
            {auction.status === 'active' ? 'Place a Bid' : 'View Auction'}
          </Link>
        </div>
      </div>
    </section>
  )
}
