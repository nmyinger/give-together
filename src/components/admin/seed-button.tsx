'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface SeedButtonProps {
  adminKey: string
}

export function SeedButton({ adminKey }: SeedButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSeed() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/seed', {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminKey}` },
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error ?? 'Seed failed')
          return
        }
        toast.success('Demo data seeded')
        router.refresh()
      } catch {
        toast.error('Network error')
      }
    })
  }

  return (
    <button
      onClick={handleSeed}
      disabled={isPending}
      className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-muted-foreground hover:border-[var(--gold)]/30 hover:text-[var(--gold)] transition-all disabled:opacity-50"
    >
      {isPending ? 'Seeding…' : 'Re-seed Demo Data'}
    </button>
  )
}
