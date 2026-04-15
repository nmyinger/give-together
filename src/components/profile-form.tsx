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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Display Name
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          disabled={isPending}
          className="bg-transparent border-white/20"
        />
      </div>
      <Button
        type="submit"
        disabled={isPending || name === user.name}
        size="sm"
      >
        {isPending ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  )
}
