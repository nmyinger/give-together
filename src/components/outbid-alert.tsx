'use client'

import { useEffect, useRef, useState } from 'react'
import { TrendingUp, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Bid } from '@/types/database'

interface OutbidAlertProps {
  bids: Bid[]
  currentUserId: string | undefined
  currentMaxBid: number
}

export function OutbidAlert({ bids, currentUserId, currentMaxBid }: OutbidAlertProps) {
  const [visible, setVisible] = useState(false)
  const [outbidAmount, setOutbidAmount] = useState(0)
  const prevLeadingRef = useRef(false)

  useEffect(() => {
    if (!currentUserId || bids.length === 0) return

    const topBid = bids[0]
    const imLeading = topBid?.user_id === currentUserId
    const iWasPreviouslyLeading = prevLeadingRef.current

    if (iWasPreviouslyLeading && !imLeading) {
      setOutbidAmount(topBid.amount)
      setVisible(true)
      prevLeadingRef.current = false
    } else if (imLeading) {
      prevLeadingRef.current = true
      setVisible(false)
    }
  }, [bids, currentUserId])

  if (!visible || !currentUserId) return null

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <div className="flex items-start gap-2.5 min-w-0">
        <TrendingUp className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-800">You&apos;ve been outbid!</p>
          <p className="text-xs text-red-700/80 mt-0.5">
            New high bid: <span className="font-semibold">{formatCurrency(outbidAmount)}</span>
            {' '}— bid <span className="font-semibold text-[var(--gold)]">{formatCurrency(currentMaxBid)}</span> or more to retake the lead.
          </p>
        </div>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="shrink-0 text-red-400 hover:text-red-700 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
