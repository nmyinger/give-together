'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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

const navLinks = [
  { href: '/', label: 'Browse auctions' },
]

export function Navbar({ user, profile }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">

        {/* Left: logo + nav */}
        <div className="flex items-center gap-6 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="h-7 w-7 rounded-lg bg-[var(--gold)] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
              <span className="text-white text-[11px] font-black leading-none select-none" aria-hidden="true">♦</span>
            </div>
            <span className="font-display italic text-[1.05rem] tracking-wide text-foreground">
              CharityBid
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-lg transition-colors',
                  pathname === link.href
                    ? 'text-foreground font-medium bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: user section */}
        <nav className="flex items-center gap-2 shrink-0">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'gap-2.5 h-9 hover:bg-muted px-2.5'
                )}
              >
                <Avatar className="h-6 w-6 ring-2 ring-[var(--gold)]/25 ring-offset-1 ring-offset-card">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[11px] font-bold bg-[var(--gold)]/12 text-[var(--gold)]">
                    {(profile?.name || user.email || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium text-foreground">
                  {profile?.name || user.email?.split('@')[0]}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-lg">
                <div className="px-3 py-2.5 border-b border-border">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {profile?.name || 'Account'}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {user.email}
                  </p>
                </div>
                <div className="py-1">
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onClick={() => router.push('/account')}
                  >
                    Account settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onClick={() => router.push('/account/bids')}
                  >
                    My bids
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onClick={() => router.push('/account/watchlist')}
                  >
                    Watchlist
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator />
                <div className="py-1">
                  <DropdownMenuItem
                    className="text-destructive cursor-pointer focus:text-destructive"
                    onClick={async () => {
                      await signOut()
                      router.refresh()
                    }}
                  >
                    Sign out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'text-muted-foreground hover:text-foreground'
                )}
              >
                Sign in
              </Link>
              <Link
                href="/auth/login"
                className={cn(buttonVariants({ size: 'sm' }), 'shadow-sm font-medium')}
              >
                Get started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
