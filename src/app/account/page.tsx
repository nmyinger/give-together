import { redirect } from 'next/navigation'
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

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">

      {/* Page header */}
      <div className="mb-10">
        <h1 className="font-display italic text-4xl text-foreground">Account</h1>
        <p className="text-muted-foreground mt-2 text-sm">{authUser.email}</p>
      </div>

      {/* Content */}
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
