import { Suspense } from 'react'
import { LoginForm } from '@/components/login-form'

export const metadata = {
  title: 'Sign in — CharityBid',
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Sign in to CharityBid</h1>
          <p className="text-sm text-muted-foreground">
            No password needed. We&apos;ll send a magic link to your email.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
