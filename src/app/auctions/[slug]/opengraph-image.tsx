import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

export const runtime = 'nodejs'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function AuctionOGImage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: auction } = await supabase
    .from('auctions')
    .select('celebrity_name, celebrity_title, charity_name, current_max_bid, starting_price, image_url')
    .eq('slug', slug)
    .single()

  const currentBid = auction
    ? auction.current_max_bid > 0
      ? auction.current_max_bid
      : auction.starting_price
    : 0

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: '#0d0d14',
          fontFamily: 'serif',
        }}
      >
        {/* Background image if available */}
        {auction?.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={auction.image_url}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.35,
            }}
          />
        )}

        {/* Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(13,13,20,0.95) 0%, rgba(13,13,20,0.7) 100%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '56px 72px',
            width: '100%',
          }}
        >
          {/* Top: brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 22, color: '#c4a040' }}>◆</div>
            <div style={{ fontSize: 22, fontStyle: 'italic', color: 'rgba(245,240,232,0.6)', letterSpacing: 1 }}>
              CharityBid
            </div>
          </div>

          {/* Middle: auction info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 14, color: 'rgba(245,240,232,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
              {auction?.celebrity_title ?? 'Exclusive Auction'}
            </div>
            <div style={{ fontSize: 68, fontStyle: 'italic', color: '#f5f0e8', lineHeight: 1.05, letterSpacing: '-1px' }}>
              {auction?.celebrity_name ?? 'Live Auction'}
            </div>
            {auction && (
              <div style={{ fontSize: 18, color: 'rgba(245,240,232,0.5)', marginTop: 4 }}>
                Benefits{' '}
                <span style={{ color: 'rgba(245,240,232,0.8)', fontWeight: 600 }}>
                  {auction.charity_name}
                </span>
              </div>
            )}
          </div>

          {/* Bottom: bid info */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 13, color: 'rgba(196,160,64,0.6)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                {auction?.current_max_bid ? 'Current bid' : 'Starting bid'}
              </div>
              <div style={{ fontSize: 52, color: '#c4a040', fontStyle: 'italic', lineHeight: 1 }}>
                {currentBid > 0 ? formatCurrency(currentBid) : 'Open'}
              </div>
            </div>
            <div
              style={{
                fontSize: 14,
                color: 'rgba(245,240,232,0.35)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Bid at charitybid.com
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
