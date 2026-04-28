'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ToggleAdminButtonProps {
  userId: string
  userName: string
  isAdmin: boolean
  isSelf: boolean
}

export function ToggleAdminButton({ userId, userName, isAdmin, isSelf }: ToggleAdminButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleToggle() {
    startTransition(async () => {
      const res = await fetch('/api/admin/set-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isAdmin: !isAdmin }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed')
        return
      }
      toast.success(isAdmin ? `Removed admin from ${userName}` : `${userName} is now an admin`)
      router.refresh()
    })
  }

  if (isSelf) {
    return (
      <span className="text-[10px] text-muted-foreground px-2 py-1 rounded border border-white/8">
        You
      </span>
    )
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={[
        'text-[10px] font-medium px-2.5 py-1 rounded border transition-all disabled:opacity-50',
        isAdmin
          ? 'border-red-400/30 text-red-400 bg-red-400/8 hover:bg-red-400/15'
          : 'border-[var(--gold)]/30 text-[var(--gold)] bg-[var(--gold)]/8 hover:bg-[var(--gold)]/15',
      ].join(' ')}
    >
      {isPending ? '…' : isAdmin ? 'Remove admin' : 'Make admin'}
    </button>
  )
}
