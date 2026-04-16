'use client'

import { useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signInWithMagicLink, signInWithGoogle } from '@/actions/auth'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await signInWithMagicLink(email)
      if (result.success) {
        setSent(true)
      } else {
        toast.error(result.error || 'Failed to send magic link')
      }
    })
  }

  function handleGoogle() {
    startTransition(async () => {
      const result = await signInWithGoogle()
      if (result.url) {
        window.location.href = result.url
      } else {
        toast.error(result.error || 'Failed to sign in with Google')
      }
    })
  }

  if (sent) {
    return (
      <div className="text-center space-y-4" style={{ animation: 'slide-up-fade 0.3s ease-out' }}>
        <div
          className="w-14 h-14 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center mx-auto"
          style={{ textShadow: '0 0 20px oklch(0.73 0.130 82 / 0.5)' }}
        >
          <span className="text-[var(--gold)] text-xl">✉</span>
        </div>
        <div className="space-y-1">
          <p className="text-foreground font-semibold">Check your email</p>
          <p className="text-sm text-muted-foreground">
            We sent a link to{' '}
            <span className="text-foreground font-medium">{email}</span>
          </p>
        </div>
        <p className="text-xs text-muted-foreground/60">
          Click the link in the email to sign in.
          <br />
          The link expires in 24 hours.
        </p>
        <button
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 mt-2"
          onClick={() => setSent(false)}
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {error === 'auth_failed' && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2.5 text-sm text-destructive text-center">
          Sign-in link expired. Please request a new one.
        </div>
      )}

      {/* Magic link form */}
      <form onSubmit={handleMagicLink} className="space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Email address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isPending}
            className="bg-transparent border-white/15 focus:border-[var(--gold)]/50 transition-colors h-11"
            autoFocus
          />
        </div>
        <Button
          type="submit"
          className="w-full h-11 bg-[var(--gold)] text-[oklch(0.11_0.010_255)] hover:bg-[var(--gold)]/95 font-bold disabled:opacity-50 transition-all"
          disabled={isPending || !email}
        >
          {isPending ? 'Sending link…' : 'Send Magic Link'}
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/8" />
        <span className="text-xs text-muted-foreground/50 font-medium">or</span>
        <div className="flex-1 h-px bg-white/8" />
      </div>

      {/* Google OAuth */}
      <Button
        variant="outline"
        className="w-full h-11 border-white/15 hover:bg-white/5 hover:border-white/25 transition-all font-medium"
        onClick={handleGoogle}
        disabled={isPending}
        type="button"
      >
        <svg className="mr-2.5 h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </Button>
    </div>
  )
}
