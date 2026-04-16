import { Suspense } from 'react'
import { LoginForm } from '@/components/login-form'

export const metadata = {
  title: 'Sign in — CharityBid',
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">

        {/* Wordmark */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-[var(--gold)] text-lg" aria-hidden="true">◆</span>
            <span className="font-display italic text-2xl tracking-wide">CharityBid</span>
          </div>
          <h1 className="text-xl font-semibold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to place bids and support great causes.
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-white/8 bg-card p-6 shadow-xl shadow-black/20">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          No password needed — we use magic links for secure, frictionless sign-in.
        </p>
      </div>
    </div>
  )
}
