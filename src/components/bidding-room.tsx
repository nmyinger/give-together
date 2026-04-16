'use client'

import { useMemo } from 'react'
import Image from 'next/image'
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
  const auction = useRealtimeAuction(initialAuction)
  const { bids, isReconnecting } = useRealtimeBids(auction.id, initialBids)

  const userNames = useMemo(() => {
    const map = new Map<string, string>()
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

  const isLive = auction.status === 'active'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Reconnecting indicator */}
      {isReconnecting && (
        <div className="mb-4 flex items-center gap-2 text-xs text-amber-400 border border-amber-400/20 bg-amber-400/5 rounded-lg px-3 py-2 w-fit">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
          Reconnecting to live auction…
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

        {/* ── Left column: context ── */}
        <div className="lg:col-span-3 space-y-7">

          {/* Hero image */}
          <div className="relative aspect-video rounded-xl overflow-hidden border border-white/8">
            <Image
              src={auction.image_url}
              alt={auction.celebrity_name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {auction.status === 'closed' && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-sm font-semibold tracking-widest uppercase text-white/60 border border-white/20 px-4 py-2 rounded-full">
                  Auction Ended
                </span>
              </div>
            )}

            {isLive && (
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-green-400/40 bg-black/70 text-green-400 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                Live Auction
              </div>
            )}
          </div>

          {/* Celebrity info */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display italic text-3xl md:text-4xl text-foreground leading-tight">
                  {auction.celebrity_name}
                </h1>
                <p className="text-muted-foreground text-sm tracking-widest uppercase mt-1">
                  {auction.celebrity_title}
                </p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {auction.description}
            </p>
            <p className="text-sm">
              100% of proceeds benefit{' '}
              {auction.charity_website ? (
                <a
                  href={auction.charity_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground font-medium underline underline-offset-2 hover:text-[var(--gold)] transition-colors"
                >
                  {auction.charity_name}
                </a>
              ) : (
                <span className="text-foreground font-medium">{auction.charity_name}</span>
              )}
            </p>
          </div>

          {/* Gold divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-[var(--gold)]/20 to-transparent" />
            <span className="text-[var(--gold)]/40 text-xs">◆</span>
            <div className="flex-1 h-px bg-gradient-to-l from-[var(--gold)]/20 to-transparent" />
          </div>

          {/* Bid activity */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Bid Activity
              </h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {auction.bid_count} {auction.bid_count === 1 ? 'bid' : 'bids'}
              </span>
            </div>
            <BidFeed
              bids={bids}
              userNames={userNames}
              currentUserId={currentUser?.id}
            />
          </div>
        </div>

        {/* ── Right column: live bid panel ── */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-24 space-y-3">

            {/* Live stats card */}
            <div className="rounded-xl border border-white/10 bg-card p-5 space-y-5">

              {/* Current bid — the star of the show */}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
                  {auction.current_max_bid > 0 ? 'Current bid' : 'Starting bid'}
                </p>
                <p
                  className="font-display italic tabular-nums leading-none"
                  style={{
                    fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
                    color: 'var(--gold)',
                    textShadow: '0 0 40px oklch(0.73 0.130 82 / 0.35)',
                  }}
                >
                  {formatCurrency(currentBid)}
                </p>
              </div>

              {/* Timer */}
              {isLive && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
                    Time remaining
                  </p>
                  <CountdownTimer endTime={auction.end_time} size="xl" />
                </div>
              )}

              {!isLive && (
                <div className="pt-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Auction ended</p>
                  {auction.winner_id && currentUser?.id === auction.winner_id && (
                    <p className="text-sm font-semibold text-green-400 mt-1">
                      You won with {formatCurrency(currentBid)}
                    </p>
                  )}
                </div>
              )}

              {/* Divider with bid count */}
              <div className="h-px bg-white/6" />
            </div>

            {/* Status banner */}
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
