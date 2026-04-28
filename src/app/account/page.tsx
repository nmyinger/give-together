import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile-form'
import { AccountPaymentSection } from '@/components/account-payment-section'

export const metadata: Metadata = {
  title: 'Account — CharityBid',
}

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) redirect('/auth/login?redirectTo=/account')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (!profile) redirect('/auth/login')

  const [
    { count: bidCount },
    { count: wonCount },
    { data: watchlist },
  ] = await Promise.all([
    supabase.from('bids').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id),
    supabase.from('auctions').select('*', { count: 'exact', head: true }).eq('winner_id', authUser.id).eq('status', 'closed'),
    supabase.from('watchlist').select('auction_id').eq('user_id', authUser.id),
  ])

  const watchCount = (watchlist ?? []).length

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center text-lg font-bold text-[var(--gold)] select-none">
            {(profile.name || authUser.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {profile.name || 'Your account'}
            </h1>
            <p className="text-xs text-muted-foreground">{authUser.email}</p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Link
          href="/account/bids"
          className="rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200 p-4 group text-center"
        >
          <p className="text-2xl font-bold tabular-nums text-foreground group-hover:text-primary transition-colors">
            {bidCount ?? 0}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
            Bids placed
          </p>
        </Link>

        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {wonCount ?? 0}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
            Auctions won
          </p>
        </div>

        <Link
          href="/"
          className="rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200 p-4 group text-center"
        >
          <p className="text-2xl font-bold tabular-nums text-foreground group-hover:text-primary transition-colors">
            {watchCount}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">
            Watching
          </p>
        </Link>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-border mb-6 gap-1">
        <span className="px-4 py-2.5 text-sm font-semibold text-foreground border-b-2 border-foreground -mb-px">
          Settings
        </span>
        <Link
          href="/account/bids"
          className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Bid history
        </Link>
      </div>

      <div className="space-y-4">

        {/* Profile section */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-border bg-muted/40">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Profile
            </h2>
          </div>
          <div className="p-5">
            <ProfileForm user={profile} />
          </div>
        </div>

        {/* Payment section */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-border bg-muted/40">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Payment method
              </h2>
              {profile.has_payment_method && (
                <span className="text-[10px] font-semibold text-green-700 border border-green-200 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Active
                </span>
              )}
            </div>
          </div>
          <div className="p-5">
            <AccountPaymentSection hasPaymentMethod={profile.has_payment_method} />
          </div>
        </div>

        {/* Trust note */}
        <div className="rounded-xl border border-border bg-muted/30 px-5 py-4">
          <div className="flex gap-2">
            <span className="text-green-600 text-sm shrink-0 mt-0.5">🔒</span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your payment method is securely stored by Stripe. CharityBid never stores card details.
              You are only charged if you win an auction — and 100% goes to the celebrity&apos;s chosen charity.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
