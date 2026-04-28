import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Manual auction close for demos — same logic as the cron but triggerable on demand.
// Secured by ADMIN_SECRET env var.
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { auctionId } = await request.json().catch(() => ({}))

  const supabase = createAdminClient()

  // Idempotent close
  const { data: closed, error: closeError } = await supabase
    .from('auctions')
    .update({ status: 'closed' })
    .eq('id', auctionId)
    .eq('status', 'active')
    .select()
    .single()

  if (closeError || !closed) {
    return NextResponse.json({ error: 'Auction not found or already closed' }, { status: 404 })
  }

  // Find highest bid
  const { data: winningBid } = await supabase
    .from('bids')
    .select('*, users(stripe_customer_id)')
    .eq('auction_id', auctionId)
    .order('amount', { ascending: false })
    .limit(1)
    .single()

  if (!winningBid) {
    return NextResponse.json({ success: true, message: 'Closed with no bids' })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const winner = winningBid.users as any
  if (!winner?.stripe_customer_id) {
    await supabase
      .from('auctions')
      .update({ winner_id: winningBid.user_id, winning_bid_id: winningBid.id })
      .eq('id', auctionId)
    return NextResponse.json({ success: true, message: 'Closed — winner has no Stripe customer' })
  }

  const paymentMethods = await stripe.paymentMethods.list({
    customer: winner.stripe_customer_id,
    type: 'card',
    limit: 1,
  })

  if (paymentMethods.data.length === 0) {
    await supabase
      .from('auctions')
      .update({ winner_id: winningBid.user_id, winning_bid_id: winningBid.id })
      .eq('id', auctionId)
    return NextResponse.json({ success: true, message: 'Closed — no payment method on file' })
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: winningBid.amount,
      currency: 'usd',
      customer: winner.stripe_customer_id,
      payment_method: paymentMethods.data[0].id,
      off_session: true,
      confirm: true,
      description: `CharityBid: ${closed.celebrity_name} — ${closed.charity_name}`,
      metadata: {
        auction_id: auctionId,
        bid_id: winningBid.id,
        winner_user_id: winningBid.user_id,
      },
    })

    await supabase
      .from('auctions')
      .update({
        winner_id: winningBid.user_id,
        winning_bid_id: winningBid.id,
        payment_intent_id: paymentIntent.id,
      })
      .eq('id', auctionId)

    return NextResponse.json({
      success: true,
      message: `Closed. Winner charged ${winningBid.amount} cents.`,
      paymentIntentId: paymentIntent.id,
    })
  } catch (err) {
    console.error('[admin/close-auction] Payment failed:', err)
    await supabase
      .from('auctions')
      .update({ winner_id: winningBid.user_id, winning_bid_id: winningBid.id })
      .eq('id', auctionId)
    return NextResponse.json({ success: true, message: 'Closed — payment failed, admin notified' })
  }
}
