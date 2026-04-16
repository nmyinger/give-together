'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/actions/auth'
import { buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { User } from '@/types/database'
import type { User as AuthUser } from '@supabase/supabase-js'

interface NavbarProps {
  user: AuthUser | null
  profile: User | null
}

export function Navbar({ user, profile }: NavbarProps) {
  const router = useRouter()

  return (
    <header className="border-b border-white/8 bg-background/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-2 group">
          <span
            className="text-[var(--gold)] text-base leading-none select-none"
            aria-hidden="true"
          >
            ◆
          </span>
          <span className="font-display italic text-[1.15rem] tracking-wide text-foreground group-hover:text-[var(--gold)] transition-colors duration-200">
            CharityBid
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'gap-2 h-9 hover:bg-white/5'
                )}
              >
                <Avatar className="h-6 w-6 ring-1 ring-[var(--gold)]/30">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs bg-[var(--gold)]/10 text-[var(--gold)]">
                    {(profile?.name || user.email || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm text-muted-foreground">
                  {profile?.name || user.email?.split('@')[0]}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 border-white/10 bg-[var(--popover)]">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push('/account')}
                >
                  Account
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/8" />
                <DropdownMenuItem
                  className="text-destructive cursor-pointer focus:text-destructive"
                  onClick={async () => {
                    await signOut()
                    router.refresh()
                  }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/auth/login"
              className={cn(
                buttonVariants({ size: 'sm' }),
                'bg-[var(--gold)] text-[oklch(0.11_0.010_255)] hover:bg-[var(--gold)]/90 font-medium'
              )}
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
