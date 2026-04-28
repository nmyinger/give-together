import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency } from '@/lib/utils'
import { CloseAuctionButton } from '@/components/admin/close-auction-button'
import { SeedButton } from '@/components/admin/seed-button'

export const dynamic = 'force-dynamic'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const { key } = await searchParams
  const adminKey = process.env.ADMIN_SECRET

  // Simple key-based auth for the admin UI
  if (!adminKey || key !== adminKey) {
    redirect(`/admin?key=${key ?? ''}`)
  }

  const supabase = createAdminClient()

  const [{ data: auctions }, { count: totalBids }, { count: totalUsers }] = await Promise.all([
    supabase
      .from('auctions')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.from('bids').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
  ])

  const active = (auctions ?? []).filter((a) => a.status === 'active')
  const closed = (auctions ?? []).filter((a) => a.status === 'closed')
  const totalRaised = (auctions ?? []).reduce((sum, a) => sum + (a.current_max_bid || 0), 0)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Internal</p>
          <h1 className="font-display italic text-3xl text-foreground">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <SeedButton adminKey={key!} />
          <Link
            href={`/admin/auctions/new?key=${key}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--gold)] text-[oklch(0.11_0.010_255)] text-sm font-bold hover:bg-[var(--gold)]/90 transition-colors"
          >
            + New Auction
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Raised', value: formatCurrency(totalRaised), highlight: true },
          { label: 'Live Auctions', value: active.length.toString() },
          { label: 'Total Bids', value: (totalBids ?? 0).toLocaleString() },
          { label: 'Registered Users', value: (totalUsers ?? 0).toLocaleString() },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="rounded-xl border border-white/8 bg-card p-4 text-center">
            <p className={`font-display italic text-2xl leading-none mb-1 ${highlight ? 'text-[var(--gold)]' : 'text-foreground'}`}>
              {value}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{label}</p>
          </div>
        ))}
      </div>

      {/* Active Auctions */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Live ({active.length})
        </h2>
        {active.length === 0 && (
          <p className="text-sm text-muted-foreground">No active auctions.</p>
        )}
        <div className="space-y-2">
          {active.map((auction) => (
            <div
              key={auction.id}
              className="flex items-center gap-4 rounded-xl border border-white/8 bg-card p-4"
            >
              <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                <Image src={auction.image_url} alt={auction.celebrity_name} fill className="object-cover" sizes="48px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display italic text-sm text-foreground">{auction.celebrity_name}</p>
                <p className="text-[10px] text-muted-foreground">{auction.charity_name}</p>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-sm font-medium text-[var(--gold)] tabular-nums">
                  {formatCurrency(auction.current_max_bid || auction.starting_price)}
                </p>
                <p className="text-[10px] text-muted-foreground">{auction.bid_count} bids</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/auctions/${auction.slug}`}
                  target="_blank"
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors"
                >
                  View ↗
                </Link>
                <CloseAuctionButton auctionId={auction.id} adminKey={key!} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Closed Auctions */}
      {closed.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Closed ({closed.length})
          </h2>
          <div className="space-y-2">
            {closed.map((auction) => (
              <div
                key={auction.id}
                className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 opacity-60"
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                  <Image src={auction.image_url} alt={auction.celebrity_name} fill className="object-cover grayscale" sizes="48px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display italic text-sm text-foreground">{auction.celebrity_name}</p>
                  <p className="text-[10px] text-muted-foreground">{auction.charity_name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-muted-foreground tabular-nums">
                    {formatCurrency(auction.current_max_bid || auction.starting_price)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{auction.bid_count} bids</p>
                </div>
                <Link
                  href={`/auctions/${auction.slug}`}
                  target="_blank"
                  className="shrink-0 px-3 py-1.5 rounded-lg border border-white/8 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  View ↗
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
