import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'CharityBid — Exclusive charity auctions'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0d0d14',
          backgroundImage:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(196,160,64,0.12) 0%, transparent 70%)',
          fontFamily: 'serif',
        }}
      >
        {/* Diamond */}
        <div style={{ fontSize: 64, color: '#c4a040', marginBottom: 24, lineHeight: 1 }}>◆</div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontStyle: 'italic',
            color: '#f5f0e8',
            letterSpacing: '-1px',
            lineHeight: 1.1,
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          CharityBid
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 26,
            color: 'rgba(245,240,232,0.55)',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          Exclusive experiences auctioned for charity.
          <br />
          100% of every winning bid goes to the cause.
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 40,
              height: 1,
              background: 'linear-gradient(to left, rgba(196,160,64,0.6), transparent)',
            }}
          />
          <div style={{ fontSize: 11, color: 'rgba(196,160,64,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Bid high · Give big
          </div>
          <div
            style={{
              width: 40,
              height: 1,
              background: 'linear-gradient(to right, rgba(196,160,64,0.6), transparent)',
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  )
}
