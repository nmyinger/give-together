'use client'

import type { Bid, Auction } from '@/types/database'
import { formatCurrency } from '@/lib/utils'

interface AuctionStatusBannerProps {
  auction: Auction
  bids: Bid[]
  currentUserId?: string
}

export function AuctionStatusBanner({ auction, bids, currentUserId }: AuctionStatusBannerProps) {
  if (!currentUserId || bids.length === 0) return null

  const highestBid = bids[0]
  const isWinning = highestBid?.user_id === currentUserId
  const userHasBid = bids.some((b) => b.user_id === currentUserId)

  if (auction.status === 'closed') {
    if (auction.winner_id === currentUserId) {
      return (
        <div
          className="rounded-xl border border-green-200 bg-green-50 px-4 py-3.5 space-y-0.5"
          style={{ animation: 'winning-glow 2s ease-in-out infinite' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-base">🎉</span>
            <p className="text-sm font-bold text-green-800">You won this auction!</p>
          </div>
          <p className="text-xs text-green-700/80 pl-7">
            Winning bid: {formatCurrency(highestBid.amount)} — your card has been charged.
          </p>
        </div>
      )
    }
    return null
  }

  if (isWinning) {
    return (
      <div
        className="rounded-xl border border-green-200 bg-green-50 px-4 py-3"
        style={{ animation: 'winning-glow 2s ease-in-out infinite' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
            <p className="text-sm font-semibold text-green-800">You&apos;re leading</p>
          </div>
          <p className="text-sm font-bold text-green-700 tabular-nums">
            {formatCurrency(highestBid.amount)}
          </p>
        </div>
      </div>
    )
  }

  if (userHasBid) {
    return (
      <div
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        style={{ animation: 'outbid-shake 0.5s ease-out' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
            <p className="text-sm font-semibold text-red-800">You&apos;ve been outbid</p>
          </div>
          <p className="text-sm font-bold text-red-700 tabular-nums">
            {formatCurrency(highestBid.amount)}
          </p>
        </div>
        <p className="text-xs text-red-700/70 mt-0.5 pl-4">
          Bid {formatCurrency(highestBid.amount + auction.min_increment)} or more to retake the lead
        </p>
      </div>
    )
  }

  return null
}
