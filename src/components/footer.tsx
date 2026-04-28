import Link from 'next/link'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="h-6 w-6 rounded-md bg-[var(--gold)] flex items-center justify-center shadow-sm">
                <span className="text-white text-[9px] font-black leading-none" aria-hidden="true">♦</span>
              </div>
              <span className="font-display italic text-base tracking-wide text-foreground group-hover:text-[var(--gold)] transition-colors duration-200">
                CharityBid
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
              Exclusive experiences auctioned for charity. Every winning bid goes directly to the cause.
            </p>
          </div>

          {/* Platform links */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform</p>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                Browse auctions
              </Link>
              <Link href="/account/bids" className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                My bids
              </Link>
              <Link href="/account" className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                Account
              </Link>
            </nav>
          </div>

          {/* Trust signals */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Giving</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-green-600 text-xs mt-0.5">✓</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  100% of every winning bid goes to the charity
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 text-xs mt-0.5">✓</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cards charged only if you win
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 text-xs mt-0.5">✓</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Payments secured by Stripe
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            © {year} CharityBid. All rights reserved.
          </p>
          <Link href="/auth/login" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
            Sign in →
          </Link>
        </div>
      </div>
    </footer>
  )
}
