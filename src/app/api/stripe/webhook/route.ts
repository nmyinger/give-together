import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object
      const auctionId = pi.metadata?.auction_id
      if (auctionId) {
        console.log(`[webhook] PaymentIntent succeeded for auction ${auctionId}: ${pi.id}`)
        // Confirm payment_intent_id is recorded (cron should have done this already)
        await supabase
          .from('auctions')
          .update({ payment_intent_id: pi.id })
          .eq('id', auctionId)
          .is('payment_intent_id', null) // only update if not already set
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object
      const auctionId = pi.metadata?.auction_id
      if (auctionId) {
        console.error(
          `[webhook] PaymentIntent FAILED for auction ${auctionId}: ${pi.id}`,
          pi.last_payment_error?.message
        )
        // TODO V2: trigger runner-up flow or admin alert
      }
      break
    }

    case 'setup_intent.succeeded': {
      // Card saved successfully — has_payment_method is set via confirmPaymentMethod() action
      // This is a safety net in case the client-side confirmation succeeded but the server action failed
      const si = event.data.object
      const customerId = si.customer as string
      if (customerId) {
        await supabase
          .from('users')
          .update({ has_payment_method: true })
          .eq('stripe_customer_id', customerId)
          .eq('has_payment_method', false) // only update if not already set
      }
      break
    }

    default:
      // Ignore unhandled event types
      break
  }

  return NextResponse.json({ received: true })
}
