'use client'

import { motion, AnimatePresence } from 'framer-motion'
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
      <div className="flex flex-col items-center justify-center py-12 space-y-2 text-center">
        <span className="text-2xl text-muted-foreground/20">◆</span>
        <p className="text-sm text-muted-foreground">No bids yet</p>
        <p className="text-xs text-muted-foreground/60">Be the first to place a bid</p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
      <AnimatePresence initial={false}>
        {bids.map((bid, index) => {
          const name = userNames.get(bid.user_id) ?? 'Anonymous'
          const isCurrentUser = bid.user_id === currentUserId
          const isHighest = index === 0
          const initial = (name || 'A').charAt(0).toUpperCase()

          return (
            <motion.div
              key={bid.id}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={`
                flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-colors
                ${isHighest
                  ? 'bg-[var(--gold)]/8 border-[var(--gold)]/25'
                  : 'bg-white/[0.02] border-white/5'
                }
              `}
            >
              {/* Avatar */}
              <div
                className={`
                  h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                  ${isCurrentUser
                    ? 'bg-[var(--gold)]/20 text-[var(--gold)] ring-1 ring-[var(--gold)]/40'
                    : 'bg-white/8 text-foreground/70'
                  }
                `}
              >
                {initial}
              </div>

              {/* Name + time */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-none truncate">
                  {isCurrentUser ? (
                    <span className="text-[var(--gold)]">You</span>
                  ) : (
                    <span className="text-foreground/90">{name}</span>
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {formatRelativeTime(bid.created_at)}
                </p>
              </div>

              {/* Amount */}
              <div className="text-right shrink-0">
                <p className={`
                  text-sm font-bold tabular-nums leading-none
                  ${isHighest ? 'text-[var(--gold)]' : 'text-foreground/60'}
                `}>
                  {formatCurrency(bid.amount)}
                </p>
                {isHighest && (
                  <p className="text-[9px] text-[var(--gold)]/60 uppercase tracking-wider font-semibold mt-0.5">
                    Leading
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
