'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BidFeed } from '@/components/bid-feed'
import { BidForm } from '@/components/bid-form'
import { CountdownTimer } from '@/components/countdown-timer'
import { AuctionStatusBanner } from '@/components/auction-status-banner'
import { OutbidAlert } from '@/components/outbid-alert'
import { ViewerCount } from '@/components/viewer-count'
import { SharePanel } from '@/components/share-panel'
import { ProxyBidForm } from '@/components/proxy-bid-form'
import { WatchButton } from '@/components/watch-button'
import { ConfettiBurst } from '@/components/confetti-burst'
import { useRealtimeBids } from '@/hooks/use-realtime-bids'
import { useRealtimeAuction } from '@/hooks/use-realtime-auction'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { Auction, Bid, User, ProxyBid } from '@/types/database'

interface BiddingRoomProps {
  initialAuction: Auction
  initialBids: Bid[]
  currentUser: User | null
  isAuthenticated: boolean
  isWatched: boolean
  existingProxy: ProxyBid | null
}

export function BiddingRoom({
  initialAuction,
  initialBids,
  currentUser,
  isAuthenticated,
  isWatched,
  existingProxy,
}: BiddingRoomProps) {
  const auction = useRealtimeAuction(initialAuction)
  const { bids, isReconnecting } = useRealtimeBids(auction.id, initialBids)
  const supabase = useRef(createClient())
  const fetchedUserIds = useRef<Set<string>>(new Set())

  const [showConfetti, setShowConfetti] = useState(false)
  const prevStatusRef = useRef(initialAuction.status)
  useEffect(() => {
    if (
      prevStatusRef.current === 'active' &&
      auction.status === 'closed' &&
      auction.winner_id &&
      currentUser?.id === auction.winner_id
    ) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 4000)
    }
    prevStatusRef.current = auction.status
  }, [auction.status, auction.winner_id, currentUser?.id])

  const [userNames, setUserNames] = useState<Map<string, string>>(() => {
    const map = new Map<string, string>()
    initialBids.forEach((bid) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const name = (bid as any).users?.name
      if (name) {
        map.set(bid.user_id, name)
        fetchedUserIds.current.add(bid.user_id)
      }
    })
    if (currentUser) {
      map.set(currentUser.id, currentUser.name || 'You')
      fetchedUserIds.current.add(currentUser.id)
    }
    return map
  })

  useEffect(() => {
    const unknownIds = bids
      .map((b) => b.user_id)
      .filter((id) => !fetchedUserIds.current.has(id))
    if (unknownIds.length === 0) return
    unknownIds.forEach((id) => fetchedUserIds.current.add(id))
    supabase.current
      .from('users')
      .select('id, name')
      .in('id', unknownIds)
      .then(({ data }) => {
        if (!data?.length) return
        setUserNames((prev) => {
          const next = new Map(prev)
          data.forEach((u) => { if (u.name) next.set(u.id, u.name) })
          return next
        })
      })
  }, [bids])

  const currentBid = auction.current_max_bid > 0 ? auction.current_max_bid : auction.starting_price
  const isLive = auction.status === 'active'
  const minBidForOutbid =
    auction.current_max_bid > 0
      ? auction.current_max_bid + auction.min_increment
      : auction.starting_price

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auctions/${auction.slug}`
      : `https://give-together-pi.vercel.app/auctions/${auction.slug}`

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {showConfetti && <ConfettiBurst />}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Auctions</Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{auction.celebrity_name}</span>
      </nav>

      {/* Reconnecting indicator */}
      {isReconnecting && (
        <div className="flex items-center gap-2 text-xs text-amber-700 border border-amber-200 bg-amber-50 rounded-lg px-3 py-2 w-fit">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
          Reconnecting to live auction…
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ── Left column ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Hero image */}
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-border shadow-sm">
            <Image
              src={auction.image_url}
              alt={auction.celebrity_name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {auction.status === 'closed' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-sm font-semibold tracking-widest uppercase text-white/80 border border-white/30 px-4 py-2 rounded-full bg-black/30 backdrop-blur-sm">
                  Auction ended
                </span>
              </div>
            )}

            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isLive && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-white/25 bg-black/55 text-white backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    Live
                  </div>
                )}
                {isLive && (
                  <div className="px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-sm border border-white/15 text-white/80">
                    <ViewerCount auctionId={auction.id} userId={currentUser?.id} />
                  </div>
                )}
              </div>
              <WatchButton
                auctionId={auction.id}
                initialWatched={isWatched}
                isAuthenticated={isAuthenticated}
                className="w-9 h-9"
              />
            </div>
          </div>

          {/* Info card */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div>
              <h1 className="font-display italic text-3xl md:text-4xl text-foreground leading-tight">
                {auction.celebrity_name}
              </h1>
              <p className="text-muted-foreground text-xs tracking-widest uppercase mt-1.5">
                {auction.celebrity_title}
              </p>
            </div>

            <p className="text-muted-foreground leading-relaxed text-sm">
              {auction.description}
            </p>

            <div className="flex items-center gap-2 pt-1 border-t border-border">
              <span className="text-xs text-green-700 font-semibold bg-green-50 border border-green-200 px-2.5 py-1 rounded-full shrink-0">
                100% to charity
              </span>
              <span className="text-sm text-muted-foreground">
                Benefits{' '}
                {auction.charity_website ? (
                  <a
                    href={auction.charity_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                  >
                    {auction.charity_name} ↗
                  </a>
                ) : (
                  <span className="font-semibold text-foreground">{auction.charity_name}</span>
                )}
              </span>
            </div>

            <SharePanel url={shareUrl} title={auction.celebrity_name} />
          </div>

          {/* Bid activity */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Bid activity</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full tabular-nums">
                {auction.bid_count} {auction.bid_count === 1 ? 'bid' : 'bids'}
              </span>
            </div>
            <div className="p-4">
              <BidFeed bids={bids} userNames={userNames} currentUserId={currentUser?.id} />
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-20 space-y-3">

            {/* Live stats card */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-5">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
                  {auction.current_max_bid > 0 ? 'Current bid' : 'Starting bid'}
                </p>
                <p
                  className="font-display italic tabular-nums leading-none text-[var(--gold)]"
                  style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}
                >
                  {formatCurrency(currentBid)}
                </p>
              </div>

              {isLive && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
                    Time remaining
                  </p>
                  <CountdownTimer endTime={auction.end_time} size="xl" />
                </div>
              )}

              {!isLive && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Auction ended</p>
                  {auction.winner_id && currentUser?.id === auction.winner_id && (
                    <p className="text-sm font-semibold text-green-700 mt-2 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                      🎉 You won with {formatCurrency(currentBid)}
                    </p>
                  )}
                </div>
              )}

              <div className="h-px bg-border" />

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-muted px-3 py-2">
                  <p className="text-sm font-bold text-foreground tabular-nums">{auction.bid_count}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Bids placed</p>
                </div>
                <div className="rounded-lg bg-muted px-3 py-2">
                  <p className="text-sm font-bold text-[var(--gold)] tabular-nums">
                    {formatCurrency(auction.min_increment)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Min increment</p>
                </div>
              </div>
            </div>

            {/* Outbid alert */}
            {isLive && currentUser && (
              <OutbidAlert
                bids={bids}
                currentUserId={currentUser.id}
                currentMaxBid={minBidForOutbid}
              />
            )}

            <AuctionStatusBanner auction={auction} bids={bids} currentUserId={currentUser?.id} />

            <BidForm
              auction={auction}
              isAuthenticated={isAuthenticated}
              hasPaymentMethod={currentUser?.has_payment_method ?? false}
            />

            <ProxyBidForm
              auction={auction}
              existingProxy={existingProxy}
              isAuthenticated={isAuthenticated}
              hasPaymentMethod={currentUser?.has_payment_method ?? false}
            />

            <p className="text-[11px] text-muted-foreground text-center px-2">
              🔒 Payments secured by Stripe. Card only charged if you win.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
