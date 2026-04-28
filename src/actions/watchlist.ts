'use server'

import { createClient } from '@/lib/supabase/server'

export async function toggleWatchlist(auctionId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('toggle_watchlist', { p_auction_id: auctionId })
  if (error) return { success: false, error: error.message }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { success: true, watched: (data as any)?.watched ?? false }
}

export async function getWatchedAuctionIds(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('watchlist')
    .select('auction_id')
    .eq('user_id', userId)
  return (data ?? []).map((r) => r.auction_id)
}
