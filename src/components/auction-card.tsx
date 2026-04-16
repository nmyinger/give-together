import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
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
      <div className="h-full rounded-xl border border-white/8 bg-card overflow-hidden transition-all duration-300 group-hover:border-[var(--gold)]/30 group-hover:shadow-lg group-hover:shadow-[var(--gold)]/5">

        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={auction.image_url}
            alt={auction.celebrity_name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {auction.status === 'closed' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge variant="secondary" className="text-sm bg-white/10 border-white/20 text-white/70">
                Auction Ended
              </Badge>
            </div>
          )}

          {/* Live indicator */}
          {auction.status === 'active' && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-green-400/30 bg-black/60 text-green-400 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                Live
              </span>
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-display italic text-lg text-foreground leading-tight">
              {auction.celebrity_name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 tracking-wide uppercase">
              {auction.celebrity_title}
            </p>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">
                {auction.current_max_bid > 0 ? 'Current bid' : 'Starting bid'}
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

          {/* Charity row */}
          <div className="pt-2.5 border-t border-white/8">
            <p className="text-xs text-muted-foreground">
              Benefits{' '}
              <span className="text-foreground/80 font-medium">{auction.charity_name}</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
