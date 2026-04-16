import type { Metadata } from 'next'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Navbar } from '@/components/navbar'
import { createClient } from '@/lib/supabase/server'

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
})

const dmSerifDisplay = DM_Serif_Display({
  variable: '--font-display',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  ),
  title: {
    default: 'CharityBid — Bid on exclusive experiences, give to causes that matter',
    template: '%s — CharityBid',
  },
  description:
    'Bid on exclusive meetings, dinners, and coaching sessions with remarkable individuals. 100% of proceeds go to their charity of choice.',
  openGraph: {
    title: 'CharityBid',
    description: 'Exclusive charity auctions. Bid high, give big.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CharityBid',
    description: 'Exclusive charity auctions. Bid high, give big.',
    images: ['/og-image.png'],
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmSerifDisplay.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground">
        <Providers>
          <Navbar user={user} profile={profile} />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
