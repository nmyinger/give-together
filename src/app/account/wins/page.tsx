import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { WinScheduling } from '@/types/database'

export const metadata: Metadata = {
  title: 'My Wins — CharityBid',
}

const SCHEDULING_STATUS: Record<WinScheduling['status'], { label: string; className: string }> = {
  pending: { label: 'Scheduling needed', className: 'text-amber-700 border-amber-200 bg-amber-50' },
  confirmed: { label: 'Confirmed', className: 'text-blue-700 border-blue-200 bg-blue-50' },
  completed: { label: 'Completed', className: 'text-green-700 border-green-200 bg-green-50' },
  cancelled: { label: 'Cancelled', className: 'text-red-700 border-red-200 bg-red-50' },
}

export default async function MyWinsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) redirect('/auth/login?redirectTo=/account/wins')

  const { data: wonAuctions } = await supabase
    .from('auctions')
    .select('id, slug, celebrity_name, celebrity_title, charity_name, image_url, current_max_bid, starting_price')
    .eq('winner_id', authUser.id)
    .eq('status', 'closed')
    .order('created_at', { ascending: false })

  const auctions = wonAuctions ?? []

  // Fetch scheduling status for all won auctions
  const schedulingByAuction = new Map<string, WinScheduling>()
  if (auctions.length > 0) {
    const { data: schedulingRows } = await supabase
      .from('win_scheduling')
      .select('*')
      .in('auction_id', auctions.map(a => a.id))

    for (const row of schedulingRows ?? []) {
      schedulingByAuction.set(row.auction_id, row as WinScheduling)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My wins</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {auctions.length === 0
              ? 'No wins yet'
              : `${auctions.length} auction${auctions.length !== 1 ? 's' : ''} won`}
          </p>
        </div>
        <Link href="/account" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
          ← Account
        </Link>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-border mb-6 gap-1">
        <Link href="/account" className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          Settings
        </Link>
        <Link href="/account/bids" className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          Bid history
        </Link>
        <Link href="/account/watchlist" className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          Watchlist
        </Link>
        <span className="px-4 py-2.5 text-sm font-semibold text-foreground border-b-2 border-foreground -mb-px">
          Wins
        </span>
      </div>

      {auctions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 rounded-2xl border border-border bg-card shadow-sm">
          <span className="text-4xl opacity-20">🏆</span>
          <div className="space-y-1">
            <p className="font-display italic text-xl text-foreground/60">No wins yet</p>
            <p className="text-sm text-muted-foreground">
              Win an auction and your experience details will appear here.
            </p>
          </div>
          <Link href="/" className={cn(buttonVariants({ size: 'sm' }), 'mt-2 shadow-sm font-semibold')}>
            View live auctions
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {auctions.map(auction => {
            const scheduling = schedulingByAuction.get(auction.id)
            const statusMeta = scheduling
              ? SCHEDULING_STATUS[scheduling.status]
              : SCHEDULING_STATUS.pending
            const winAmount = auction.current_max_bid > 0 ? auction.current_max_bid : auction.starting_price

            return (
              <Link
                key={auction.id}
                href={`/auctions/${auction.slug}`}
                className="block rounded-xl border border-border bg-card hover:shadow-sm hover:border-primary/25 transition-all duration-200 overflow-hidden group"
              >
                <div className="p-4 flex items-center gap-4">
                  {auction.image_url && (
                    <div className="shrink-0 h-14 w-14 rounded-lg overflow-hidden border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={auction.image_url}
                        alt={auction.celebrity_name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {auction.celebrity_name}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                          {auction.celebrity_title}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold tabular-nums text-[var(--gold)]">
                          {formatCurrency(winAmount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">winning bid</p>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className={cn(
                        'text-[10px] font-semibold border px-2 py-0.5 rounded-full uppercase tracking-wide',
                        statusMeta.className
                      )}>
                        {statusMeta.label}
                      </span>
                      {scheduling?.scheduled_for && (
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(scheduling.scheduled_for).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground truncate">{auction.charity_name}</p>
                    </div>
                  </div>
                </div>

                {!scheduling && (
                  <div className="px-4 pb-3">
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Action needed: submit your availability to schedule this experience →
                    </p>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
