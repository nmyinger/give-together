'use client'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function BackButton() {
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'sm' }),
        'text-muted-foreground hover:text-foreground'
      )}
    >
      ← Go back
    </button>
  )
}
