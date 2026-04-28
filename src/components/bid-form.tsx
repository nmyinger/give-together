'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { placeBid } from '@/actions/bid'
import { formatCurrency } from '@/lib/utils'
import type { Auction } from '@/types/database'

interface BidFormProps {
  auction: Auction
  isAuthenticated: boolean
  hasPaymentMethod: boolean
}

export function BidForm({ auction, isAuthenticated, hasPaymentMethod }: BidFormProps) {
  const [customAmount, setCustomAmount] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const currentBid = auction.current_max_bid > 0
    ? auction.current_max_bid
    : auction.starting_price - auction.min_increment
  const minBid = currentBid > 0 ? currentBid + auction.min_increment : auction.starting_price

  const quickAmounts = [
    minBid,
    minBid + auction.min_increment * 4,
    minBid + auction.min_increment * 9,
  ]

  const isDisabled = auction.status !== 'active' || isPending

  function handleBid(amountCents: number) {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    if (!hasPaymentMethod) {
      router.push('/account')
      return
    }

    startTransition(async () => {
      const result = await placeBid(auction.id, amountCents)
      if (result.success) {
        setCustomAmount('')
        toast.success(`Bid of ${formatCurrency(amountCents)} placed!`)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault()
    const dollarAmount = parseFloat(customAmount)
    if (isNaN(dollarAmount) || dollarAmount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    const cents = Math.round(dollarAmount * 100)
    if (cents < minBid) {
      toast.error(`Minimum bid is ${formatCurrency(minBid)}`)
      return
    }
    handleBid(cents)
  }

  if (auction.status === 'closed') {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-center space-y-1 shadow-sm">
        <p className="text-sm font-medium text-foreground">This auction has ended</p>
        <p className="text-xs text-muted-foreground">Thank you to all who participated</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground">Sign in to place a bid</p>
          <p className="text-xs text-muted-foreground">No password required — we use magic links</p>
        </div>
        <Button
          className="w-full font-semibold shadow-sm"
          onClick={() => router.push('/auth/login')}
        >
          Sign in to bid
        </Button>
      </div>
    )
  }

  if (!hasPaymentMethod) {
    return (
      <div className="rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-5 space-y-4 shadow-sm">
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground">Add a payment method to bid</p>
          <p className="text-xs text-muted-foreground">
            Your card is only charged if you win
          </p>
        </div>
        <Button
          className="w-full font-semibold shadow-sm"
          onClick={() => router.push('/account')}
        >
          Add payment method
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5 shadow-sm">

      {/* Minimum bid info */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Minimum bid</p>
          <p className="font-display text-lg text-[var(--gold)] tabular-nums leading-none">
            {formatCurrency(minBid)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Increment</p>
          <p className="text-sm font-medium text-muted-foreground tabular-nums">
            +{formatCurrency(auction.min_increment)}
          </p>
        </div>
      </div>

      {/* Quick bid buttons */}
      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Quick bid</p>
        <div className="grid grid-cols-3 gap-2">
          {quickAmounts.map((amount, i) => (
            <button
              key={amount}
              onClick={() => handleBid(amount)}
              disabled={isDisabled}
              className="group relative rounded-xl border border-border bg-card px-2 py-3 text-center transition-all duration-200 hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="block text-xs font-bold tabular-nums text-foreground group-hover:text-primary transition-colors">
                {formatCurrency(amount)}
              </span>
              {i === 0 && (
                <span className="block text-[9px] text-muted-foreground mt-0.5 tracking-wide uppercase">
                  Min
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom amount */}
      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Custom amount</p>
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium select-none">
              $
            </span>
            <Input
              type="number"
              placeholder={(minBid / 100).toFixed(0)}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              min={minBid / 100}
              step="1"
              disabled={isDisabled}
              className="pl-6 bg-card"
            />
          </div>
          <Button
            type="submit"
            disabled={isDisabled || !customAmount}
            className="shrink-0 font-semibold shadow-sm disabled:opacity-40"
          >
            {isPending ? '…' : 'Bid'}
          </Button>
        </form>
      </div>
    </div>
  )
}
