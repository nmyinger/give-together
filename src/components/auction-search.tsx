'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { AuctionGrid } from '@/components/auction-grid'
import { Input } from '@/components/ui/input'
import type { Auction } from '@/types/database'

interface AuctionSearchProps {
  auctions: Auction[]
  title: string
  isAuthenticated?: boolean
  watchedIds?: string[]
}

export function AuctionSearch({ auctions, title, isAuthenticated = false, watchedIds = [] }: AuctionSearchProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return auctions
    return auctions.filter(
      (a) =>
        a.celebrity_name.toLowerCase().includes(q) ||
        a.celebrity_title.toLowerCase().includes(q) ||
        a.charity_name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    )
  }, [auctions, query])

  return (
    <div className="space-y-5">
      {auctions.length > 3 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
          <Input
            type="search"
            placeholder="Search by name, charity, or keyword…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 text-sm h-9"
          />
        </div>
      )}
      <AuctionGrid
        auctions={filtered}
        title={query ? `Results for "${query}"` : title}
        isAuthenticated={isAuthenticated}
        watchedIds={watchedIds}
      />
      {filtered.length === 0 && query && (
        <div className="py-10 text-center rounded-xl border border-border bg-card">
          <p className="text-muted-foreground text-sm">No auctions match &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  )
}
