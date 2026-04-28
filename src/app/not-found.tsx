import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BackButton } from '@/components/back-button'

export const metadata = {
  title: 'Page Not Found — CharityBid',
}

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-20 relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, oklch(0.73 0.130 82 / 0.04) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 text-center space-y-8 max-w-md">
        <div className="space-y-3">
          <p
            className="font-display italic text-[7rem] leading-none text-[var(--gold)]/15 select-none"
            aria-hidden="true"
          >
            404
          </p>
          <h1 className="font-display italic text-3xl text-foreground -mt-4">
            Auction not found
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            This auction may have ended, been removed, or the link is incorrect.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/20 to-transparent" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className={cn(
              buttonVariants({ size: 'sm' }),
              'bg-[var(--gold)] text-[oklch(0.11_0.010_255)] hover:bg-[var(--gold)]/90 font-bold'
            )}
          >
            View Live Auctions
          </Link>
          <BackButton />
        </div>
      </div>
    </div>
  )
}
