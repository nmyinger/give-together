'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateProfile } from '@/actions/profile'
import type { User } from '@/types/database'

interface ProfileFormProps {
  user: User
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateProfile(name)
      if (result.success) {
        toast.success('Profile updated')
      } else {
        toast.error(result.error ?? 'Failed to update profile')
      }
    })
  }

  const hasChanged = name !== user.name

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="display-name" className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          Display Name
        </label>
        <Input
          id="display-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          disabled={isPending}
          className="bg-transparent border-white/15 focus:border-[var(--gold)]/50 transition-colors"
        />
        <p className="text-xs text-muted-foreground/50">
          This name appears next to your bids in auction feeds.
        </p>
      </div>
      <Button
        type="submit"
        disabled={isPending || !hasChanged}
        size="sm"
        className="font-semibold disabled:opacity-40"
      >
        {isPending ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  )
}
