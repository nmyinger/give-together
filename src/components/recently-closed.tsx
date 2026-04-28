import Link from 'next/link'
import Image from 'next/image'
import { Trophy } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Auction } from '@/types/database'

interface RecentlyClosedProps {
  auctions: Auction[]
}

export function RecentlyClosed({ auctions }: RecentlyClosedProps) {
  if (auctions.length === 0) return null

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-4">
        <h2 className="font-display italic text-xl text-foreground shrink-0">Recently closed</h2>
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground shrink-0">{auctions.length} ended</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {auctions.map((auction) => (
          <Link
            key={auction.id}
            href={`/auctions/${auction.slug}`}
            className="group flex gap-3 rounded-xl border border-border bg-card p-3 hover:shadow-sm hover:border-primary/20 transition-all duration-200 shadow-sm"
          >
            <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
              <Image
                src={auction.image_url}
                alt={auction.celebrity_name}
                fill
                className="object-cover opacity-75 group-hover:opacity-90 transition-opacity"
                sizes="56px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display italic text-sm text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                {auction.celebrity_name}
              </p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{auction.charity_name}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Trophy className="w-3 h-3 text-[var(--gold)]" />
                <span className="text-xs font-semibold text-[var(--gold)] tabular-nums">
                  {formatCurrency(auction.current_max_bid || auction.starting_price)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
