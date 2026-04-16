'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Auction } from '@/types/database'

export function useRealtimeAuction(initialAuction: Auction) {
  const [auction, setAuction] = useState<Auction>(initialAuction)
  const supabase = useRef(createClient())

  // On reconnect: refetch latest auction state to fill any gaps
  const refetchAuction = useCallback(async () => {
    const { data } = await supabase.current
      .from('auctions')
      .select('*')
      .eq('id', initialAuction.id)
      .single()
    if (data) setAuction(data)
  }, [initialAuction.id])

  useEffect(() => {
    const client = supabase.current
    let wasDisconnected = false

    const channel = client
      .channel(`auction:${initialAuction.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auctions',
          filter: `id=eq.${initialAuction.id}`,
        },
        (payload) => {
          setAuction((prev) => ({ ...prev, ...(payload.new as Partial<Auction>) }))
        }
      )
      .on('system', {}, (status) => {
        if (status.status === 'SUBSCRIBED' && wasDisconnected) {
          wasDisconnected = false
          // Refetch to get any updates missed during the disconnect window
          refetchAuction()
        }
        if (
          status.status === 'CHANNEL_ERROR' ||
          status.status === 'TIMED_OUT' ||
          status.status === 'CLOSED'
        ) {
          wasDisconnected = true
        }
      })
      .subscribe()

    return () => {
      client.removeChannel(channel)
    }
  }, [initialAuction.id, refetchAuction])

  return auction
}
