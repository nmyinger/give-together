import { Suspense } from 'react'
import { LoginForm } from '@/components/login-form'

export const metadata = {
  title: 'Sign in — CharityBid',
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">

      <div className="w-full max-w-sm space-y-8" style={{ animation: 'slide-up-fade 0.35s ease-out' }}>

        {/* Logo mark */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="h-10 w-10 rounded-xl bg-[var(--gold)] flex items-center justify-center shadow-md">
              <span className="text-white text-base font-black leading-none" aria-hidden="true">♦</span>
            </div>
            <span className="font-display italic text-2xl tracking-wide text-foreground">
              CharityBid
            </span>
          </div>

          <h1 className="text-2xl font-semibold text-foreground">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sign in to place bids and support causes that matter.
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        {/* Footnote */}
        <div className="text-center space-y-1.5">
          <p className="text-xs text-muted-foreground">
            No password required — we use magic links for secure sign-in.
          </p>
          <p className="text-xs text-muted-foreground/60">
            100% of every winning bid goes directly to charity.
          </p>
        </div>
      </div>
    </div>
  )
}
