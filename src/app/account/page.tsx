import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile-form'
import { AccountPaymentSection } from '@/components/account-payment-section'
import { Separator } from '@/components/ui/separator'

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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-muted-foreground mt-1 text-sm">{authUser.email}</p>
      </div>

      <Separator className="border-white/10" />

      <section className="space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <ProfileForm user={profile} />
      </section>

      <Separator className="border-white/10" />

      <section className="space-y-4">
        <h2 className="font-semibold">Payment Method</h2>
        <AccountPaymentSection hasPaymentMethod={profile.has_payment_method} />
      </section>
    </div>
  )
}
