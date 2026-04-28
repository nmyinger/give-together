import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile-form'
import { AccountPaymentSection } from '@/components/account-payment-section'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

  // Bid count for the account overview
  const { count: bidCount } = await supabase
    .from('bids')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', authUser.id)

  const { count: wonCount } = await supabase
    .from('auctions')
    .select('*', { count: 'exact', head: true })
    .eq('winner_id', authUser.id)
    .eq('status', 'closed')

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">

      {/* Page header */}
      <div className="mb-10">
        <h1 className="font-display italic text-4xl text-foreground">Account</h1>
        <p className="text-muted-foreground mt-2 text-sm">{authUser.email}</p>
      </div>

      {/* Stats strip */}
      {(bidCount ?? 0) > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3">
          <Link
            href="/account/bids"
            className="rounded-xl border border-white/8 bg-card hover:border-[var(--gold)]/30 transition-colors p-4 group"
          >
            <p className="text-2xl font-display tabular-nums text-foreground group-hover:text-[var(--gold)] transition-colors">
              {bidCount ?? 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
              Total Bids
            </p>
          </Link>
          <div className="rounded-xl border border-white/8 bg-card p-4">
            <p className="text-2xl font-display tabular-nums text-foreground">
              {wonCount ?? 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
              Auctions Won
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">

        {/* Profile section */}
        <div className="rounded-xl border border-white/8 bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Profile
            </h2>
          </div>
          <div className="p-6">
            <ProfileForm user={profile} />
          </div>
        </div>

        {/* Payment section */}
        <div className="rounded-xl border border-white/8 bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Payment Method
              </h2>
              {profile.has_payment_method && (
                <span className="text-[10px] font-medium text-green-400 border border-green-400/30 bg-green-400/8 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Active
                </span>
              )}
            </div>
          </div>
          <div className="p-6">
            <AccountPaymentSection hasPaymentMethod={profile.has_payment_method} />
          </div>
        </div>

        {/* Bid history link */}
        <Link
          href="/account/bids"
          className="block rounded-xl border border-white/8 bg-card hover:border-[var(--gold)]/20 transition-colors overflow-hidden"
        >
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Bid History
              </h2>
              <p className="text-sm text-foreground/70 mt-1">
                {(bidCount ?? 0) > 0 ? `${bidCount} bid${bidCount !== 1 ? 's' : ''} placed` : 'No bids yet'}
              </p>
            </div>
            <span className="text-muted-foreground/40 text-sm">→</span>
          </div>
        </Link>

        {/* Billing info */}
        <div className="rounded-xl border border-white/5 bg-white/[0.015] px-6 py-4">
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            Your payment method is securely stored by Stripe. CharityBid never stores your card details.
            You are only charged if you win an auction — 100% goes to the celebrity&apos;s chosen charity.
          </p>
        </div>
      </div>
    </div>
  )
}
