'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BidFeed } from '@/components/bid-feed'
import { BidForm } from '@/components/bid-form'
import { CountdownTimer } from '@/components/countdown-timer'
import { AuctionStatusBanner } from '@/components/auction-status-banner'
import { useRealtimeBids } from '@/hooks/use-realtime-bids'
import { useRealtimeAuction } from '@/hooks/use-realtime-auction'
import { formatCurrency } from '@/lib/utils'
import type { Auction, Bid, User } from '@/types/database'

interface BiddingRoomProps {
  initialAuction: Auction
  initialBids: Bid[]
  currentUser: User | null
  isAuthenticated: boolean
}

export function BiddingRoom({
  initialAuction,
  initialBids,
  currentUser,
  isAuthenticated,
}: BiddingRoomProps) {
  // Live auction state — updates when popcorn extension fires or auction closes
  const auction = useRealtimeAuction(initialAuction)
  // Live bid feed — updates with every new bid
  const bids = useRealtimeBids(auction.id, initialBids)

  // Build a name map from the initial bids data so we can display bidder names
  const userNames = useMemo(() => {
    const map = new Map<string, string>()
    // The initial bids already have user names from the server-side join
    // For new realtime bids, we'll add names as we encounter them
    initialBids.forEach((bid) => {
      // @ts-expect-error — server side joins users.name onto the bid
      if (bid.users?.name) map.set(bid.user_id, bid.users.name)
    })
    if (currentUser) {
      map.set(currentUser.id, currentUser.name || 'You')
    }
    return map
  }, [initialBids, currentUser])

  const currentBid = auction.current_max_bid > 0
    ? auction.current_max_bid
    : auction.starting_price

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Left column: auction info + bid feed */}
        <div className="lg:col-span-3 space-y-6">

          {/* Hero image */}
          <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10">
            <Image
              src={auction.image_url}
              alt={auction.celebrity_name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
            {auction.status === 'closed' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="secondary" className="text-base px-4 py-2">
                  Auction Ended
                </Badge>
              </div>
            )}
          </div>

          {/* Celebrity & description */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{auction.celebrity_name}</h1>
                <p className="text-muted-foreground">{auction.celebrity_title}</p>
              </div>
              {auction.status === 'active' && (
                <Badge variant="outline" className="border-green-400/50 text-green-400 shrink-0">
                  Live
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground leading-relaxed">{auction.description}</p>
            <p className="text-sm">
              All proceeds benefit{' '}
              {auction.charity_website ? (
                <a
                  href={auction.charity_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground font-medium underline underline-offset-2"
                >
                  {auction.charity_name}
                </a>
              ) : (
                <span className="text-foreground font-medium">{auction.charity_name}</span>
              )}
            </p>
          </div>

          <Separator className="border-white/10" />

          {/* Bid feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Bid Activity</h2>
              <span className="text-sm text-muted-foreground">
                {auction.bid_count} bid{auction.bid_count !== 1 ? 's' : ''}
              </span>
            </div>
            <BidFeed
              bids={bids}
              userNames={userNames}
              currentUserId={currentUser?.id}
            />
          </div>
        </div>

        {/* Right column: sticky bid panel */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-24 space-y-4">

            {/* Live stats */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    {auction.current_max_bid > 0 ? 'Current bid' : 'Starting bid'}
                  </p>
                  <p className="text-2xl font-bold tabular-nums">{formatCurrency(currentBid)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    {auction.status === 'active' ? 'Ends in' : 'Ended'}
                  </p>
                  {auction.status === 'active' ? (
                    <CountdownTimer endTime={auction.end_time} size="lg" />
                  ) : (
                    <p className="text-2xl font-bold text-muted-foreground">—</p>
                  )}
                </div>
              </div>
            </div>

            {/* Status banner (outbid / winning) */}
            <AuctionStatusBanner
              auction={auction}
              bids={bids}
              currentUserId={currentUser?.id}
            />

            {/* Bid form */}
            <BidForm
              auction={auction}
              isAuthenticated={isAuthenticated}
              hasPaymentMethod={currentUser?.has_payment_method ?? false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
