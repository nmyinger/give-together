import { formatCurrency } from '@/lib/utils'

interface StatsStripProps {
  totalRaisedCents: number
  activeAuctions: number
  totalBids: number
}

export function StatsStrip({ totalRaisedCents, activeAuctions, totalBids }: StatsStripProps) {
  if (totalRaisedCents === 0 && totalBids === 0) return null

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="grid grid-cols-3 divide-x divide-border">
        <Stat
          label="Raised for charity"
          value={totalRaisedCents > 0 ? formatCurrency(totalRaisedCents) : '—'}
          highlight
        />
        <Stat
          label="Live auctions"
          value={activeAuctions.toString()}
          pulse={activeAuctions > 0}
        />
        <Stat
          label="Bids placed"
          value={totalBids > 0 ? totalBids.toLocaleString() : '—'}
        />
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  highlight,
  pulse,
}: {
  label: string
  value: string
  highlight?: boolean
  pulse?: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center py-5 px-4 text-center">
      <div className="flex items-center gap-2 mb-1.5">
        {pulse && (
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        )}
        <p
          className="font-display italic tabular-nums leading-none"
          style={{
            fontSize: 'clamp(1.3rem, 3vw, 1.85rem)',
            color: highlight ? 'var(--gold)' : 'var(--foreground)',
          }}
        >
          {value}
        </p>
      </div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{label}</p>
    </div>
  )
}
