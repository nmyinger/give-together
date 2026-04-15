'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PaymentForm } from '@/components/payment-form'
import { createSetupIntent } from '@/actions/payment'
import { CreditCard, CheckCircle } from 'lucide-react'

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
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
          <p className="text-sm font-medium">Card on file</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-white/20 hover:bg-white/5"
          onClick={handleAddCard}
          disabled={isPending}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Update card
        </Button>
      </div>
    )
  }

  if (clientSecret) {
    return (
      <div className="space-y-3">
        <PaymentForm clientSecret={clientSecret} onSuccess={handleSuccess} />
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => setClientSecret(null)}
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        A payment method is required to place bids. Your card will only be charged if you win an auction.
      </p>
      <Button
        onClick={handleAddCard}
        disabled={isPending}
        size="sm"
      >
        <CreditCard className="h-4 w-4 mr-2" />
        {isPending ? 'Setting up…' : 'Add Payment Method'}
      </Button>
    </div>
  )
}
