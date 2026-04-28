'use server'

import { createClient } from '@/lib/supabase/server'

export async function setProxyBid(auctionId: string, maxAmountCents: number) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('upsert_proxy_bid', {
    p_auction_id: auctionId,
    p_max_amount: maxAmountCents,
  })
  if (error) return { success: false, error: error.message }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = data as any
  if (result?.error) return { success: false, error: result.error }
  return {
    success: true,
    autoBidPlaced: result?.auto_bid_placed ?? false,
    autoBidAmount: result?.auto_bid_amount ?? null,
  }
}

export async function getMyProxyBid(auctionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('proxy_bids')
    .select('*')
    .eq('auction_id', auctionId)
    .eq('user_id', user.id)
    .single()
  return data ?? null
}

export async function cancelProxyBid(auctionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }
  const { error } = await supabase
    .from('proxy_bids')
    .delete()
    .eq('auction_id', auctionId)
    .eq('user_id', user.id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}
