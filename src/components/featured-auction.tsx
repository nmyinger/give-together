import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
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
    <section className="relative rounded-2xl overflow-hidden border border-white/10">
      <div className="relative aspect-[21/9] min-h-[280px]">
        <Image
          src={auction.image_url}
          alt={auction.celebrity_name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      </div>

      <div className="absolute inset-0 flex items-center">
        <div className="p-8 md:p-12 max-w-lg space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
              Featured
            </Badge>
            {auction.status === 'active' && (
              <Badge variant="outline" className="border-green-400/50 text-green-400 backdrop-blur-sm">
                Live
              </Badge>
            )}
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              {auction.celebrity_name}
            </h1>
            <p className="text-white/70 mt-1">{auction.celebrity_title}</p>
          </div>

          <div className="flex items-end gap-8">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wide mb-1">
                {auction.current_max_bid > 0 ? 'Current bid' : 'Starting bid'}
              </p>
              <p className="text-3xl font-bold text-white tabular-nums">
                {formatCurrency(currentBid)}
              </p>
            </div>

            {auction.status === 'active' && (
              <div>
                <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Ends in</p>
                <CountdownTimer endTime={auction.end_time} size="lg" className="text-white" />
              </div>
            )}
          </div>

          <p className="text-white/60 text-sm">
            All proceeds benefit{' '}
            <span className="text-white font-medium">{auction.charity_name}</span>
          </p>

          <Link
            href={`/auctions/${auction.slug}`}
            className={cn(buttonVariants({ size: 'lg' }), 'w-fit')}
          >
            {auction.status === 'active' ? 'Place a Bid' : 'View Auction'}
          </Link>
        </div>
      </div>
    </section>
  )
}
