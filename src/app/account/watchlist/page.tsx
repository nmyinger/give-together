import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AuctionGrid } from '@/components/auction-grid'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Watchlist — CharityBid',
}

export default async function WatchlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirectTo=/account/watchlist')

  const { data: entries } = await supabase
    .from('watchlist')
    .select('auction_id, auctions(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auctions = (entries ?? []).map((e: any) => e.auctions).filter(Boolean)
  const watchedIds = auctions.map((a: { id: string }) => a.id)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Watchlist</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {auctions.length === 0 ? 'No saved auctions' : `${auctions.length} saved auction${auctions.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/account" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          ← Account
        </Link>
      </div>

      {auctions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 rounded-2xl border border-border bg-card shadow-sm">
          <span className="text-3xl text-rose-400/30">♥</span>
          <div className="space-y-1">
            <p className="font-display italic text-xl text-foreground/60">Nothing saved yet</p>
            <p className="text-sm text-muted-foreground">
              Tap the heart on any auction to save it here.
            </p>
          </div>
          <Link
            href="/"
            className={cn(buttonVariants({ size: 'sm' }), 'mt-2 shadow-sm font-semibold')}
          >
            Browse auctions
          </Link>
        </div>
      ) : (
        <AuctionGrid
          auctions={auctions}
          title={`${auctions.length} saved auction${auctions.length !== 1 ? 's' : ''}`}
          isAuthenticated
          watchedIds={watchedIds}
        />
      )}
    </div>
  )
}
