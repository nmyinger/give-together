import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const supabase = await createClient()

  const { data: auctions } = await supabase
    .from('auctions')
    .select('slug, created_at')

  const auctionUrls: MetadataRoute.Sitemap = (auctions ?? []).map((a) => ({
    url: `${base}/auctions/${a.slug}`,
    lastModified: new Date(a.created_at),
    changeFrequency: 'hourly',
    priority: 0.8,
  }))

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    ...auctionUrls,
  ]
}
