'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface CloseAuctionButtonProps {
  auctionId: string
  adminKey: string
}

export function CloseAuctionButton({ auctionId, adminKey }: CloseAuctionButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClose() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/close-auction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminKey}`,
          },
          body: JSON.stringify({ auctionId }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error ?? 'Failed to close auction')
          return
        }
        toast.success(data.message ?? 'Auction closed')
        router.refresh()
      } catch {
        toast.error('Network error')
      }
    })
  }

  return (
    <button
      onClick={handleClose}
      disabled={isPending}
      className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
    >
      {isPending ? 'Closing…' : 'Close & Charge'}
    </button>
  )
}
