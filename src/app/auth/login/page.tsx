import { Suspense } from 'react'
import { LoginForm } from '@/components/login-form'

export const metadata = {
  title: 'Sign in — CharityBid',
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 relative overflow-hidden">

      {/* Atmospheric background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, oklch(0.73 0.130 82 / 0.04) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-sm space-y-8 relative z-10" style={{ animation: 'slide-up-fade 0.4s ease-out' }}>

        {/* Logotype */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2.5 mb-5">
            <div className="relative">
              <span
                className="text-[var(--gold)] text-2xl leading-none select-none"
                style={{ textShadow: '0 0 20px oklch(0.73 0.130 82 / 0.6)' }}
                aria-hidden="true"
              >
                ◆
              </span>
            </div>
            <span className="font-display italic text-2xl tracking-wide text-foreground">
              CharityBid
            </span>
          </div>

          <h1 className="text-2xl font-display italic text-foreground">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sign in to place bids and support causes that matter.
          </p>
        </div>

        {/* Gold accent line */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/30 to-transparent" />
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-white/8 bg-card/80 backdrop-blur-sm p-7 shadow-2xl shadow-black/30">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        {/* Footnote */}
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground/60">
            No password required — we use magic links for secure, frictionless sign-in.
          </p>
          <p className="text-xs text-muted-foreground/40">
            100% of winning bids go directly to charity.
          </p>
        </div>
      </div>
    </div>
  )
}
