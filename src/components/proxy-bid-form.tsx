'use client'

import { useState, useTransition } from 'react'
import { Bot, ChevronDown, ChevronUp, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { setProxyBid, cancelProxyBid } from '@/actions/proxy-bid'
import { formatCurrency } from '@/lib/utils'
import type { Auction, ProxyBid } from '@/types/database'

interface ProxyBidFormProps {
  auction: Auction
  existingProxy: ProxyBid | null
  isAuthenticated: boolean
  hasPaymentMethod: boolean
}

export function ProxyBidForm({ auction, existingProxy, isAuthenticated, hasPaymentMethod }: ProxyBidFormProps) {
  const [expanded, setExpanded] = useState(false)
  const [maxAmount, setMaxAmount] = useState('')
  const [isPending, startTransition] = useTransition()
  const [activeProxy, setActiveProxy] = useState<ProxyBid | null>(existingProxy)

  const minBid =
    auction.current_max_bid > 0
      ? auction.current_max_bid + auction.min_increment
      : auction.starting_price

  if (!isAuthenticated || !hasPaymentMethod || auction.status !== 'active') return null

  function handleSet(e: React.FormEvent) {
    e.preventDefault()
    const dollars = parseFloat(maxAmount)
    if (isNaN(dollars) || dollars <= 0) {
      toast.error('Enter a valid maximum bid')
      return
    }
    const cents = Math.round(dollars * 100)
    if (cents < minBid) {
      toast.error(`Auto-bid max must be at least ${formatCurrency(minBid)}`)
      return
    }

    startTransition(async () => {
      const result = await setProxyBid(auction.id, cents)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setActiveProxy({ ...activeProxy!, max_amount: cents, auction_id: auction.id, user_id: '', id: '', created_at: '', updated_at: '' })
      setMaxAmount('')
      setExpanded(false)
      if (result.autoBidPlaced) {
        toast.success(`Auto-bid activated! Placed opening bid of ${formatCurrency(result.autoBidAmount ?? 0)}`)
      } else {
        toast.success(`Auto-bid set to ${formatCurrency(cents)}. We'll bid for you automatically.`)
      }
    })
  }

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelProxyBid(auction.id)
      if (result.success) {
        setActiveProxy(null)
        toast.success('Auto-bid cancelled')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Bot className="w-3.5 h-3.5 text-[var(--gold)]" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">Auto-Bid</span>
            {activeProxy ? (
              <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                Active · max {formatCurrency(activeProxy.max_amount)}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">Set your maximum</span>
            )}
          </div>
        </div>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        }
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border">
          <p className="text-[11px] text-muted-foreground pt-3 leading-relaxed">
            Set the most you&apos;re willing to pay. We&apos;ll bid on your behalf just enough to keep you in the lead — up to your maximum.
          </p>

          {activeProxy && (
            <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-3 py-2">
              <div className="text-xs">
                <span className="text-muted-foreground">Active max: </span>
                <span className="text-foreground font-semibold">{formatCurrency(activeProxy.max_amount)}</span>
              </div>
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
          )}

          <form onSubmit={handleSet} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">$</span>
              <Input
                type="number"
                placeholder={(minBid / 100).toFixed(0)}
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                min={minBid / 100}
                step="1"
                disabled={isPending}
                className="pl-6 text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={isPending || !maxAmount}
              size="sm"
              variant="outline"
              className="shrink-0 border-[var(--gold)]/40 text-[var(--gold)] hover:bg-[var(--gold)]/8 disabled:opacity-40"
            >
              {isPending ? '…' : activeProxy ? 'Update' : 'Set'}
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
