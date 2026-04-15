'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Auction } from '@/types/database'

export function useRealtimeAuction(initialAuction: Auction) {
  const [auction, setAuction] = useState<Auction>(initialAuction)
  const supabase = useRef(createClient())

  useEffect(() => {
    const client = supabase.current

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
      .subscribe()

    return () => {
      client.removeChannel(channel)
    }
  }, [initialAuction.id])

  return auction
}
