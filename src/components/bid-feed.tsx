'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import type { Bid } from '@/types/database'

interface BidFeedProps {
  bids: Bid[]
  userNames: Map<string, string>
  currentUserId?: string
}

export function BidFeed({ bids, userNames, currentUserId }: BidFeedProps) {
  if (bids.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        No bids yet. Be the first!
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
      <AnimatePresence initial={false}>
        {bids.map((bid, index) => {
          const name = userNames.get(bid.user_id) ?? 'Anonymous'
          const isCurrentUser = bid.user_id === currentUserId
          const isHighest = index === 0

          return (
            <motion.div
              key={bid.id}
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
                isHighest
                  ? 'bg-white/10 border border-white/20'
                  : 'bg-white/[0.03] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback className="text-xs bg-white/10">
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-none truncate">
                    {isCurrentUser ? (
                      <span className="text-primary">You</span>
                    ) : (
                      name
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatRelativeTime(bid.created_at)}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 ml-3">
                <p className={`text-sm font-bold tabular-nums ${isHighest ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {formatCurrency(bid.amount)}
                </p>
                {isHighest && (
                  <p className="text-[10px] text-green-400 uppercase tracking-wide font-medium">
                    Highest
                  </p>
                )}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
