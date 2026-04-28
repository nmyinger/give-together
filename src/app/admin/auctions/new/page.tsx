import { redirect } from 'next/navigation'
import { NewAuctionForm } from '@/components/admin/new-auction-form'

export default async function NewAuctionPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const { key } = await searchParams
  const adminKey = process.env.ADMIN_SECRET

  if (!adminKey || key !== adminKey) {
    redirect('/')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Admin</p>
        <h1 className="font-display italic text-3xl text-foreground">New Auction</h1>
      </div>
      <NewAuctionForm adminKey={key!} />
    </div>
  )
}
