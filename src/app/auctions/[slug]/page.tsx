import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { BiddingRoom } from '@/components/bidding-room'
import type { Bid } from '@/types/database'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: auction } = await supabase
    .from('auctions')
    .select('celebrity_name, description, charity_name')
    .eq('slug', slug)
    .single()

  if (!auction) return { title: 'Auction Not Found' }

  return {
    title: `${auction.celebrity_name} — CharityBid`,
    description: `Bid for an exclusive experience with ${auction.celebrity_name}. All proceeds benefit ${auction.charity_name}.`,
  }
}

export default async function AuctionPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: auction } = await supabase
    .from('auctions')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!auction) notFound()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  // Fetch bids, user profile, watchlist status, and proxy bid in parallel
  const [bidsResult, currentUserResult, watchlistResult, proxyResult] = await Promise.all([
    supabase
      .from('bids')
      .select('*, users(id, name, avatar_url)')
      .eq('auction_id', auction.id)
      .order('amount', { ascending: false })
      .limit(50),
    authUser
      ? supabase.from('users').select('*').eq('id', authUser.id).single()
      : Promise.resolve({ data: null }),
    authUser
      ? supabase.from('watchlist').select('auction_id').eq('user_id', authUser.id).eq('auction_id', auction.id).maybeSingle()
      : Promise.resolve({ data: null }),
    authUser
      ? supabase.from('proxy_bids').select('*').eq('user_id', authUser.id).eq('auction_id', auction.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return (
    <BiddingRoom
      initialAuction={auction}
      initialBids={(bidsResult.data ?? []) as Bid[]}
      currentUser={currentUserResult.data ?? null}
      isAuthenticated={!!authUser}
      isWatched={!!watchlistResult.data}
      existingProxy={proxyResult.data ?? null}
    />
  )
}
