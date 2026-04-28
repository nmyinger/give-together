'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOutbidEmail } from '@/lib/email'
import type { Bid } from '@/types/database'

type BidResult =
  | { success: true; bid: Bid }
  | { success: false; error: string }

export async function placeBid(auctionId: string, amount: number): Promise<BidResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Capture current leader before placing bid (for outbid notification)
  const { data: currentLeader } = await supabase
    .from('bids')
    .select('user_id, amount, auctions(slug, celebrity_name, celebrity_title, min_increment)')
    .eq('auction_id', auctionId)
    .order('amount', { ascending: false })
    .limit(1)
    .single()

  const { data, error } = await supabase.rpc('place_bid', {
    p_auction_id: auctionId,
    p_amount: amount,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  const result = data as { bid?: Bid; error?: string }

  if (result.error) {
    return { success: false, error: result.error }
  }

  if (!result.bid) {
    return { success: false, error: 'Unexpected error placing bid' }
  }

  // Send outbid email to displaced leader (fire-and-forget, don't block response)
  if (currentLeader && currentLeader.user_id !== user.id) {
    const admin = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auction = currentLeader.auctions as any
    admin.auth.admin.getUserById(currentLeader.user_id).then(({ data: authUser }) => {
      const loserEmail = authUser?.user?.email
      if (!loserEmail || !auction) return
      admin.from('users').select('name').eq('id', currentLeader.user_id).single().then(({ data: profile }) => {
        sendOutbidEmail(admin, {
          loserEmail,
          loserName: profile?.name ?? '',
          auctionName: `${auction.celebrity_name} — ${auction.celebrity_title}`,
          newBid: amount,
          minNextBid: amount + (auction.min_increment ?? 100),
          auctionSlug: auction.slug,
          userId: currentLeader.user_id,
          auctionId,
        })
      })
    })
  }

  return { success: true, bid: result.bid }
}
