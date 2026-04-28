import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { BiddingRoom } from '@/components/bidding-room'
import { WinSchedulingForm } from '@/components/win-scheduling-form'
import type { Bid, WinScheduling } from '@/types/database'

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

  const isWinner = authUser && auction.status === 'closed' && auction.winner_id === authUser.id

  // Fetch bids, user profile, watchlist status, proxy bid, and scheduling in parallel
  const [bidsResult, currentUserResult, watchlistResult, proxyResult, schedulingResult] = await Promise.all([
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
    isWinner
      ? supabase.from('win_scheduling').select('*').eq('auction_id', auction.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return (
    <div>
      <BiddingRoom
        initialAuction={auction}
        initialBids={(bidsResult.data ?? []) as Bid[]}
        currentUser={currentUserResult.data ?? null}
        isAuthenticated={!!authUser}
        isWatched={!!watchlistResult.data}
        existingProxy={proxyResult.data ?? null}
      />
      {isWinner && authUser && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12 -mt-2">
          <WinSchedulingForm
            auctionId={auction.id}
            winnerId={authUser.id}
            existing={(schedulingResult.data as WinScheduling | null)}
          />
        </div>
      )}
    </div>
  )
}
