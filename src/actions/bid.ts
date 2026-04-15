'use server'

import { createClient } from '@/lib/supabase/server'
import type { Bid } from '@/types/database'

type BidResult =
  | { success: true; bid: Bid }
  | { success: false; error: string }

export async function placeBid(auctionId: string, amount: number): Promise<BidResult> {
  const supabase = await createClient()

  // Verify the user is authenticated before calling the DB function
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data, error } = await supabase.rpc('place_bid', {
    p_auction_id: auctionId,
    p_amount: amount,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // The function returns JSONB: { bid: {...} } or { error: "..." }
  const result = data as { bid?: Bid; error?: string }

  if (result.error) {
    return { success: false, error: result.error }
  }

  if (!result.bid) {
    return { success: false, error: 'Unexpected error placing bid' }
  }

  return { success: true, bid: result.bid }
}
