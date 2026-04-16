'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PaymentForm } from '@/components/payment-form'
import { createSetupIntent } from '@/actions/payment'

interface AccountPaymentSectionProps {
  hasPaymentMethod: boolean
}

export function AccountPaymentSection({ hasPaymentMethod: initialHas }: AccountPaymentSectionProps) {
  const [hasPaymentMethod, setHasPaymentMethod] = useState(initialHas)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleAddCard() {
    startTransition(async () => {
      const result = await createSetupIntent()
      if (result.error || !result.clientSecret) {
        toast.error(result.error ?? 'Failed to initialize payment setup')
        return
      }
      setClientSecret(result.clientSecret)
    })
  }

  function handleSuccess() {
    setHasPaymentMethod(true)
    setClientSecret(null)
    router.refresh()
  }

  if (hasPaymentMethod && !clientSecret) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/6 px-4 py-3">
          <div className="h-8 w-8 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
            <span className="text-green-400 text-sm">✓</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-green-400">Card on file</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You&apos;re ready to bid on any active auction.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-white/15 hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
          onClick={handleAddCard}
          disabled={isPending}
        >
          {isPending ? 'Setting up…' : 'Update card'}
        </Button>
      </div>
    )
  }

  if (clientSecret) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter your card details below. Your card is only charged if you win an auction.
        </p>
        <PaymentForm clientSecret={clientSecret} onSuccess={handleSuccess} />
        <button
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          onClick={() => setClientSecret(null)}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/8 bg-white/[0.02] px-4 py-3.5 space-y-2">
        <p className="text-sm font-medium text-foreground/80">No payment method on file</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Add a card to start bidding. You&apos;re only charged if you win — your card is never
          charged upfront.
        </p>
      </div>
      <Button
        onClick={handleAddCard}
        disabled={isPending}
        className="bg-[var(--gold)] text-[oklch(0.11_0.010_255)] hover:bg-[var(--gold)]/95 font-bold"
        size="sm"
      >
        {isPending ? 'Setting up…' : 'Add Payment Method'}
      </Button>
    </div>
  )
}
