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

  // Create SetupIntent to save the card for off-session use
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    usage: 'off_session',
    payment_method_types: ['card'],
  })

  if (!setupIntent.client_secret) {
    return { clientSecret: null, error: 'Failed to create setup intent' }
  }

  return { clientSecret: setupIntent.client_secret, error: null }
}

export async function confirmPaymentMethod(): Promise<{ success: boolean; error?: string }> {
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

  // Verify they actually have a payment method
  const paymentMethods = await stripe.paymentMethods.list({
    customer: profile.stripe_customer_id,
    type: 'card',
    limit: 1,
  })

  if (paymentMethods.data.length === 0) {
    return { success: false, error: 'No payment method found' }
  }

  // Set the default payment method on the customer
  await stripe.customers.update(profile.stripe_customer_id, {
    invoice_settings: {
      default_payment_method: paymentMethods.data[0].id,
    },
  })

  // Mark as having a payment method
  await supabase
    .from('users')
    .update({ has_payment_method: true })
    .eq('id', user.id)

  return { success: true }
}
