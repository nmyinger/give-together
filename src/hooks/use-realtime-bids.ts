'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Bid } from '@/types/database'

const MAX_BIDS = 50

export function useRealtimeBids(auctionId: string, initialBids: Bid[]) {
  const [bids, setBids] = useState<Bid[]>(initialBids)
  const supabase = useRef(createClient())

  useEffect(() => {
    const client = supabase.current

    const channel = client
      .channel(`bids:${auctionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `auction_id=eq.${auctionId}`,
        },
        (payload) => {
          const newBid = payload.new as Bid
          setBids((prev) => [newBid, ...prev].slice(0, MAX_BIDS))
        }
      )
      .subscribe()

    return () => {
      client.removeChannel(channel)
    }
  }, [auctionId])

  return bids
}
