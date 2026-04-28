'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { toggleWatchlist } from '@/actions/watchlist'

interface WatchButtonProps {
  auctionId: string
  initialWatched: boolean
  isAuthenticated: boolean
  className?: string
}

export function WatchButton({ auctionId, initialWatched, isAuthenticated, className }: WatchButtonProps) {
  const [watched, setWatched] = useState(initialWatched)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    startTransition(async () => {
      const result = await toggleWatchlist(auctionId)
      if (result.success) {
        setWatched(result.watched)
        toast.success(result.watched ? 'Added to watchlist' : 'Removed from watchlist')
      } else {
        toast.error('Could not update watchlist')
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
      className={cn(
        'group flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200',
        'bg-black/60 backdrop-blur-sm border border-white/10',
        'hover:border-rose-400/50 hover:bg-rose-400/10',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      <Heart
        className={cn(
          'w-3.5 h-3.5 transition-all duration-200',
          watched
            ? 'fill-rose-400 text-rose-400'
            : 'text-white/50 group-hover:text-rose-400'
        )}
      />
    </button>
  )
}
