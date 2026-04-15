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

  if (auction.status === 'closed') {
    if (auction.winner_id === currentUserId) {
      return (
        <div className="rounded-lg bg-green-500/15 border border-green-500/30 px-4 py-3 text-sm text-green-400 font-medium">
          You won this auction with a bid of {formatCurrency(highestBid.amount)}!
        </div>
      )
    }
    return null
  }

  if (isWinning) {
    return (
      <div className="rounded-lg bg-green-500/15 border border-green-500/30 px-4 py-3 text-sm text-green-400 font-medium">
        You&apos;re the highest bidder at {formatCurrency(highestBid.amount)}
      </div>
    )
  }

  // Check if the user has any bids in this auction (they've been outbid)
  const userHasBid = bids.some((b) => b.user_id === currentUserId)
  if (userHasBid) {
    return (
      <div className="rounded-lg bg-red-500/15 border border-red-500/30 px-4 py-3 text-sm text-red-400 font-medium">
        You&apos;ve been outbid — current high is {formatCurrency(highestBid.amount)}
      </div>
    )
  }

  return null
}
