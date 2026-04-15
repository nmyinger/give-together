'use client'

import { useState } from 'react'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { confirmPaymentMethod } from '@/actions/payment'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormInnerProps {
  clientSecret: string
  onSuccess: () => void
}

function PaymentFormInner({ clientSecret, onSuccess }: PaymentFormInnerProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    const card = elements.getElement(CardElement)
    if (!card) return

    setIsLoading(true)
    try {
      const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card },
      })

      if (error) {
        toast.error(error.message ?? 'Failed to save card')
        return
      }

      if (!setupIntent?.payment_method) {
        toast.error('Card setup incomplete — please try again')
        return
      }

      const pmId = typeof setupIntent.payment_method === 'string'
        ? setupIntent.payment_method
        : setupIntent.payment_method.id

      const result = await confirmPaymentMethod(pmId)
      if (result.success) {
        toast.success('Card saved!')
        onSuccess()
      } else {
        toast.error(result.error ?? 'Failed to confirm card')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="rounded-lg border border-white/20 bg-white/5 px-4 py-3">
        <CardElement
          options={{
            style: {
              base: {
                color: '#ffffff',
                fontFamily: 'inherit',
                fontSize: '15px',
                fontSmoothing: 'antialiased',
                '::placeholder': { color: 'rgba(255,255,255,0.35)' },
              },
              invalid: { color: '#ef4444' },
            },
            hidePostalCode: true,
          }}
        />
      </div>
      <Button type="submit" disabled={!stripe || isLoading} className="w-full">
        {isLoading ? 'Saving…' : 'Save Card'}
      </Button>
    </form>
  )
}

interface PaymentFormProps {
  clientSecret: string
  onSuccess: () => void
}

export function PaymentForm({ clientSecret, onSuccess }: PaymentFormProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        appearance: {
          theme: 'night',
        },
      }}
    >
      <PaymentFormInner clientSecret={clientSecret} onSuccess={onSuccess} />
    </Elements>
  )
}
