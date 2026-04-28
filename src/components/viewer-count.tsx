'use client'

import { useEffect, useState, useRef } from 'react'
import { Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ViewerCountProps {
  auctionId: string
  userId: string | undefined
}

export function ViewerCount({ auctionId, userId }: ViewerCountProps) {
  const [count, setCount] = useState(1)
  const supabase = useRef(createClient())

  useEffect(() => {
    const channelName = `presence:auction:${auctionId}`
    const channel = supabase.current.channel(channelName, {
      config: { presence: { key: userId ?? 'anon-' + Math.random().toString(36).slice(2) } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setCount(Math.max(1, Object.keys(state).length))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ joined_at: Date.now() })
        }
      })

    return () => {
      channel.untrack().then(() => supabase.current.removeChannel(channel))
    }
  }, [auctionId, userId])

  return (
    <div className="flex items-center gap-1.5 text-xs text-white/70">
      <Eye className="w-3 h-3" />
      <span className="tabular-nums">{count}</span>
      <span>watching</span>
    </div>
  )
}
