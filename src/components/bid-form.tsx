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
      <div className="rounded-xl border border-white/8 bg-card p-5 text-center space-y-1">
        <p className="text-sm font-medium text-muted-foreground">This auction has ended</p>
        <p className="text-xs text-muted-foreground/60">Thank you to all who participated</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-white/8 bg-card p-5 space-y-3 text-center">
        <div className="space-y-1">
          <p className="text-sm font-medium">Sign in to place a bid</p>
          <p className="text-xs text-muted-foreground">Magic link — no password required</p>
        </div>
        <Button
          className="w-full bg-[var(--gold)] text-[oklch(0.11_0.010_255)] hover:bg-[var(--gold)]/95 font-bold"
          onClick={() => router.push('/auth/login')}
        >
          Sign in to Bid
        </Button>
      </div>
    )
  }

  if (!hasPaymentMethod) {
    return (
      <div className="rounded-xl border border-[var(--gold)]/20 bg-[var(--gold)]/5 p-5 space-y-3 text-center">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[var(--gold)]">Add a payment method</p>
          <p className="text-xs text-muted-foreground">
            Your card is only charged if you win
          </p>
        </div>
        <Button
          className="w-full bg-[var(--gold)] text-[oklch(0.11_0.010_255)] hover:bg-[var(--gold)]/95 font-bold"
          onClick={() => router.push('/account')}
        >
          Add Payment Method
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/8 bg-card p-5 space-y-4">

      {/* Minimum bid label */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Minimum bid</p>
          <p className="font-display text-xl text-foreground tabular-nums mt-0.5">
            {formatCurrency(minBid)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Increment</p>
          <p className="text-sm text-muted-foreground tabular-nums mt-0.5">
            +{formatCurrency(auction.min_increment)}
          </p>
        </div>
      </div>

      <div className="h-px bg-white/6" />

      {/* Quick bid buttons */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Quick bid</p>
        <div className="grid grid-cols-3 gap-2">
          {quickAmounts.map((amount, i) => (
            <button
              key={amount}
              onClick={() => handleBid(amount)}
              disabled={isDisabled}
              className="group relative overflow-hidden rounded-lg border border-white/12 bg-white/[0.03] px-2 py-3 text-center transition-all duration-200 hover:border-[var(--gold)]/50 hover:bg-[var(--gold)]/8 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]/50"
            >
              <span className="block text-xs font-bold tabular-nums text-foreground group-hover:text-[var(--gold)] transition-colors">
                {formatCurrency(amount)}
              </span>
              {i === 0 && (
                <span className="block text-[9px] text-muted-foreground/60 mt-0.5 tracking-wide uppercase">
                  Min
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom amount */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Custom amount</p>
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
              className="pl-6 bg-transparent border-white/15 focus:border-[var(--gold)]/50 transition-colors"
            />
          </div>
          <Button
            type="submit"
            disabled={isDisabled || !customAmount}
            className="shrink-0 bg-[var(--gold)] text-[oklch(0.11_0.010_255)] hover:bg-[var(--gold)]/95 font-bold disabled:opacity-40"
          >
            {isPending ? '…' : 'Bid'}
          </Button>
        </form>
      </div>

      <p className="text-[10px] text-muted-foreground/50 text-center">
        Card only charged if you win. Secure via Stripe.
      </p>
    </div>
  )
}
