import Link from 'next/link'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/6 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

          {/* Brand */}
          <div className="space-y-2">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <span className="text-[var(--gold)] text-sm leading-none select-none" aria-hidden="true">◆</span>
              <span className="font-display italic text-base tracking-wide text-foreground/80 group-hover:text-[var(--gold)] transition-colors duration-200">
                CharityBid
              </span>
            </Link>
            <p className="text-xs text-muted-foreground/50 max-w-xs leading-relaxed">
              Exclusive experiences auctioned for charity. 100% of every winning bid goes directly to the cause.
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Auctions</Link>
            <Link href="/account" className="hover:text-foreground transition-colors">Account</Link>
            <Link href="/auth/login" className="hover:text-foreground transition-colors">Sign in</Link>
          </nav>
        </div>

        {/* Bottom strip */}
        <div className="mt-8 pt-6 border-t border-white/4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground/40">
            © {year} CharityBid. All rights reserved.
          </p>
          <p className="text-[11px] text-muted-foreground/30">
            Payments secured by Stripe. Card charged only if you win.
          </p>
        </div>
      </div>
    </footer>
  )
}
