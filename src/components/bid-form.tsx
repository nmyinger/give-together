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

  const currentBid = auction.current_max_bid > 0 ? auction.current_max_bid : auction.starting_price - auction.min_increment
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
      <div className="rounded-xl border border-white/8 bg-card p-5 text-center">
        <p className="text-muted-foreground text-sm">This auction has ended.</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-white/8 bg-card p-5 space-y-3">
        <p className="text-sm text-muted-foreground text-center">Sign in to place a bid</p>
        <Button
          className="w-full bg-[var(--gold)] text-[oklch(0.11_0.010_255)] hover:bg-[var(--gold)]/90 font-semibold"
          onClick={() => router.push('/auth/login')}
        >
          Sign in
        </Button>
      </div>
    )
  }

  if (!hasPaymentMethod) {
    return (
      <div className="rounded-xl border border-white/8 bg-card p-5 space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          Add a payment method to start bidding
        </p>
        <Button
          className="w-full bg-[var(--gold)] text-[oklch(0.11_0.010_255)] hover:bg-[var(--gold)]/90 font-semibold"
          onClick={() => router.push('/account')}
        >
          Add Payment Method
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/8 bg-card p-5 space-y-4">
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Minimum bid</p>
        <p className="font-display text-3xl text-[var(--gold)] tabular-nums leading-none">{formatCurrency(minBid)}</p>
      </div>

      {/* Quick bid buttons */}
      <div className="grid grid-cols-3 gap-2">
        {quickAmounts.map((amount) => (
          <Button
            key={amount}
            variant="outline"
            size="sm"
            onClick={() => handleBid(amount)}
            disabled={isDisabled}
            className="border-white/15 hover:border-[var(--gold)]/40 hover:bg-[var(--gold)]/8 hover:text-[var(--gold)] text-xs font-semibold tabular-nums transition-colors"
          >
            {formatCurrency(amount)}
          </Button>
        ))}
      </div>

      {/* Custom amount */}
      <form onSubmit={handleCustomSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
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
            className="pl-6 bg-transparent border-white/20"
          />
        </div>
        <Button type="submit" disabled={isDisabled || !customAmount} className="shrink-0">
          {isPending ? 'Placing…' : 'Bid'}
        </Button>
      </form>
    </div>
  )
}
