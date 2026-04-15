'use client'

import { useState } from 'react'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { confirmPaymentMethod } from '@/actions/payment'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormInnerProps {
  onSuccess: () => void
}

function PaymentFormInner({ onSuccess }: PaymentFormInnerProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsLoading(true)
    try {
      const { error } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
      })

      if (error) {
        toast.error(error.message ?? 'Failed to save payment method')
        return
      }

      // Confirm on the server and set has_payment_method = true
      const result = await confirmPaymentMethod()
      if (result.success) {
        toast.success('Payment method saved!')
        onSuccess()
      } else {
        toast.error(result.error ?? 'Failed to confirm payment method')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />
      <Button type="submit" disabled={!stripe || isLoading} className="w-full">
        {isLoading ? 'Saving…' : 'Save Payment Method'}
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
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#ffffff',
            colorBackground: '#0a0a0a',
            colorText: '#ffffff',
            colorDanger: '#ef4444',
            fontFamily: 'inherit',
            borderRadius: '8px',
          },
        },
      }}
    >
      <PaymentFormInner onSuccess={onSuccess} />
    </Elements>
  )
}
