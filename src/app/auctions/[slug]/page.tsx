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

  // Fetch the auction
  const { data: auction } = await supabase
    .from('auctions')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!auction) notFound()

  // Fetch top 50 bids with user names
  const { data: bids } = await supabase
    .from('bids')
    .select('*, users(id, name, avatar_url)')
    .eq('auction_id', auction.id)
    .order('amount', { ascending: false })
    .limit(50)

  // Fetch current user profile
  const { data: { user: authUser } } = await supabase.auth.getUser()
  let currentUser = null
  if (authUser) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()
    currentUser = data
  }

  return (
    <BiddingRoom
      initialAuction={auction}
      initialBids={(bids ?? []) as Bid[]}
      currentUser={currentUser}
      isAuthenticated={!!authUser}
    />
  )
}
