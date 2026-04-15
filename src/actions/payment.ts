'use server'

import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function createSetupIntent(): Promise<
  { clientSecret: string; error: null } | { clientSecret: null; error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { clientSecret: null, error: 'Not authenticated' }
  }

  // Fetch current profile
  const { data: profile } = await supabase
    .from('users')
    .select('stripe_customer_id, name')
    .eq('id', user.id)
    .single()

  try {
    let customerId = profile?.stripe_customer_id

    // Create Stripe customer if they don't have one yet
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.name || undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Card-only SetupIntent — used with CardElement + confirmCardSetup.
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session',
      payment_method_types: ['card'],
    })

    if (!setupIntent.client_secret) {
      return { clientSecret: null, error: 'Failed to create setup intent' }
    }

    return { clientSecret: setupIntent.client_secret, error: null }
  } catch (err) {
    console.error('[createSetupIntent] Stripe error:', err)
    return { clientSecret: null, error: 'Payment setup failed. Please try again.' }
  }
}

// paymentMethodId comes directly from setupIntent.payment_method on the client,
// so we know exactly which PM was confirmed — no list call needed.
export async function confirmPaymentMethod(
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return { success: false, error: 'No Stripe customer found' }
  }

  try {
    // Verify the PM actually belongs to this customer (security check)
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId)
    if (pm.customer !== profile.stripe_customer_id) {
      return { success: false, error: 'Payment method mismatch' }
    }

    // Set as the default payment method for off-session charges
    await stripe.customers.update(profile.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    // Mark user as having a payment method
    await supabase
      .from('users')
      .update({ has_payment_method: true })
      .eq('id', user.id)

    return { success: true }
  } catch (err) {
    console.error('[confirmPaymentMethod] Stripe error:', err)
    return { success: false, error: 'Failed to confirm payment method. Please try again.' }
  }
}
