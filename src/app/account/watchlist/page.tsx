import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AuctionGrid } from '@/components/auction-grid'

export const dynamic = 'force-dynamic'

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
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Account</p>
        <h1 className="font-display italic text-3xl text-foreground">Watchlist</h1>
      </div>

      {auctions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <span className="text-3xl text-rose-400/20">♥</span>
          <div className="space-y-1">
            <p className="font-display italic text-xl text-foreground/60">Nothing saved yet</p>
            <p className="text-sm text-muted-foreground">
              Tap the heart on any auction to save it here.
            </p>
          </div>
          <Link
            href="/"
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--gold)] text-[oklch(0.11_0.010_255)] text-sm font-bold hover:bg-[var(--gold)]/90 transition-colors"
          >
            Browse Auctions
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
