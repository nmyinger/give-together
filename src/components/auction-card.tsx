import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
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
    <Link href={`/auctions/${auction.slug}`}>
      <Card className="group overflow-hidden border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20 transition-all duration-200 cursor-pointer h-full">
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={auction.image_url}
            alt={auction.celebrity_name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {auction.status === 'closed' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary" className="text-sm">Auction Ended</Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-foreground leading-tight">
              {auction.celebrity_name}
            </h3>
            <p className="text-sm text-muted-foreground">{auction.celebrity_title}</p>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
                {auction.current_max_bid > 0 ? 'Current bid' : 'Starting bid'}
              </p>
              <p className="text-xl font-bold tabular-nums text-foreground">
                {formatCurrency(currentBid)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-0.5">
                {auction.status === 'active' ? 'Ends in' : 'Ended'}
              </p>
              {auction.status === 'active' ? (
                <CountdownTimer endTime={auction.end_time} size="sm" />
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </div>

          <div className="pt-1 border-t border-white/10">
            <p className="text-xs text-muted-foreground">
              Benefiting{' '}
              <span className="text-foreground font-medium">{auction.charity_name}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
