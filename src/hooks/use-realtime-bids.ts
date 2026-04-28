'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Bid } from '@/types/database'

const MAX_BIDS = 50

export function useRealtimeBids(auctionId: string, initialBids: Bid[]) {
  const [bids, setBids] = useState<Bid[]>(initialBids)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const isReconnectingRef = useRef(false)
  const supabase = useRef(createClient())

  const refetchBids = useCallback(async () => {
    const { data } = await supabase.current
      .from('bids')
      .select('*')
      .eq('auction_id', auctionId)
      .order('amount', { ascending: false })
      .limit(MAX_BIDS)
    if (data) setBids(data)
  }, [auctionId])

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
      .on('system', {}, (status) => {
        if (status.status === 'SUBSCRIBED') {
          if (isReconnectingRef.current) {
            isReconnectingRef.current = false
            setIsReconnecting(false)
            refetchBids()
          }
        }
        if (
          status.status === 'CHANNEL_ERROR' ||
          status.status === 'TIMED_OUT' ||
          status.status === 'CLOSED'
        ) {
          isReconnectingRef.current = true
          setIsReconnecting(true)
        }
      })
      .subscribe()

    return () => {
      client.removeChannel(channel)
    }
  }, [auctionId, refetchBids])

  return { bids, isReconnecting }
}
