'use client'

import { useState } from 'react'
import { Share2, Check, Link } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SharePanelProps {
  url: string
  title: string
  className?: string
}

export function SharePanel({ url, title, className }: SharePanelProps) {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      toast.success('Link copied!')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function shareTwitter() {
    const text = `Bid on an exclusive experience with ${title} — 100% goes to charity. @CharityBid`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1">
        <Share2 className="w-3 h-3" /> Share
      </span>
      <button
        onClick={shareTwitter}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card text-xs text-muted-foreground hover:border-sky-400/60 hover:text-sky-600 transition-all duration-200 shadow-sm"
      >
        <span className="text-[10px] font-bold">𝕏</span>
        Post
      </button>
      <button
        onClick={copyLink}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card text-xs text-muted-foreground hover:border-[var(--gold)]/50 hover:text-[var(--gold)] transition-all duration-200 shadow-sm"
      >
        {copied ? <Check className="w-3 h-3" /> : <Link className="w-3 h-3" />}
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  )
}
