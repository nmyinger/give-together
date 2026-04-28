import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewAuctionForm } from '@/components/admin/new-auction-form'

export default async function NewAuctionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirectTo=/admin/auctions/new')

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  const adminKey = process.env.ADMIN_SECRET ?? ''

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Admin</p>
        <h1 className="font-display italic text-3xl text-foreground">New Auction</h1>
      </div>
      <NewAuctionForm adminKey={adminKey} />
    </div>
  )
}
