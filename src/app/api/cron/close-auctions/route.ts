import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'
import { sendWinnerEmail, sendPaymentFailedEmail } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Find all active auctions that have passed their end time
  const { data: expiredAuctions, error } = await supabase
    .from('auctions')
    .select('*')
    .eq('status', 'active')
    .lt('end_time', new Date().toISOString())

  if (error) {
    console.error('[cron/close-auctions] DB error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!expiredAuctions || expiredAuctions.length === 0) {
    return NextResponse.json({ closed: 0 })
  }

  const results = await Promise.allSettled(
    expiredAuctions.map((auction) => closeAuction(supabase, auction))
  )

  const closed = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  console.log(`[cron/close-auctions] Closed: ${closed}, Failed: ${failed}`)
  return NextResponse.json({ closed, failed })
}

async function closeAuction(
  supabase: ReturnType<typeof createAdminClient>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  auction: any
) {
  // Idempotent close — only update if still active (prevents double-processing)
  const { data: closed, error: closeError } = await supabase
    .from('auctions')
    .update({ status: 'closed' })
    .eq('id', auction.id)
    .eq('status', 'active') // guard
    .select()
    .single()

  if (closeError || !closed) {
    // Already closed by another invocation
    return
  }

  // Find the highest bid
  const { data: winningBid } = await supabase
    .from('bids')
    .select('*, users(name, stripe_customer_id)')
    .eq('auction_id', auction.id)
    .order('amount', { ascending: false })
    .limit(1)
    .single()

  if (!winningBid) {
    console.log(`[cron] Auction ${auction.id} closed with no bids`)
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const winner = winningBid.users as any
  if (!winner?.stripe_customer_id) {
    console.error(`[cron] Winner has no Stripe customer for auction ${auction.id}`)
    return
  }

  // Fetch winner email from auth
  const { data: authUser } = await supabase.auth.admin.getUserById(winningBid.user_id)
  const winnerEmail = authUser?.user?.email

  const paymentMethods = await stripe.paymentMethods.list({
    customer: winner.stripe_customer_id,
    type: 'card',
    limit: 1,
  })

  if (paymentMethods.data.length === 0) {
    console.error(`[cron] No payment method for winner in auction ${auction.id}`)
    return
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: winningBid.amount,
      currency: 'usd',
      customer: winner.stripe_customer_id,
      payment_method: paymentMethods.data[0].id,
      off_session: true,
      confirm: true,
      description: `CharityBid: ${auction.celebrity_name} — ${auction.charity_name}`,
      metadata: {
        auction_id: auction.id,
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
      .eq('id', auction.id)

    console.log(`[cron] Auction ${auction.id} closed. Winner charged ${winningBid.amount} cents.`)

    if (winnerEmail) {
      await sendWinnerEmail(supabase, {
        winnerEmail,
        winnerName: winner.name ?? '',
        auctionName: `${auction.celebrity_name} — ${auction.celebrity_title}`,
        charityName: auction.charity_name,
        amount: winningBid.amount,
        auctionSlug: auction.slug,
        userId: winningBid.user_id,
        auctionId: auction.id,
      })
    }
  } catch (err) {
    console.error(`[cron] Payment failed for auction ${auction.id}:`, err)
    await supabase
      .from('auctions')
      .update({
        winner_id: winningBid.user_id,
        winning_bid_id: winningBid.id,
      })
      .eq('id', auction.id)

    if (winnerEmail) {
      await sendPaymentFailedEmail(supabase, {
        winnerEmail,
        winnerName: winner.name ?? '',
        auctionName: `${auction.celebrity_name} — ${auction.celebrity_title}`,
        amount: winningBid.amount,
        userId: winningBid.user_id,
        auctionId: auction.id,
      })
    }
  }
}
