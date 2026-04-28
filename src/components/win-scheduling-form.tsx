'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WinScheduling } from '@/types/database'

interface WinSchedulingFormProps {
  auctionId: string
  winnerId: string
  existing: WinScheduling | null
}

const STATUS_LABELS: Record<WinScheduling['status'], { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-50 text-blue-800 border-blue-200' },
  completed: { label: 'Completed', className: 'bg-green-50 text-green-800 border-green-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-800 border-red-200' },
}

export function WinSchedulingForm({ auctionId, winnerId, existing }: WinSchedulingFormProps) {
  const [availability, setAvailability] = useState(existing?.availability ?? '')
  const [contactEmail, setContactEmail] = useState(existing?.contact_email ?? '')
  const [contactPhone, setContactPhone] = useState(existing?.contact_phone ?? '')
  const [timezone, setTimezone] = useState(existing?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const status = existing?.status ?? 'pending'
  const statusMeta = STATUS_LABELS[status]
  const isLocked = status === 'confirmed' || status === 'completed' || status === 'cancelled'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isLocked) return
    setSaving(true)
    setError(null)
    setSaved(false)

    const supabase = createClient()
    const payload = {
      auction_id: auctionId,
      winner_id: winnerId,
      availability,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      timezone,
      notes: notes || null,
    }

    const { error: err } = await supabase
      .from('win_scheduling')
      .upsert(payload, { onConflict: 'auction_id' })

    setSaving(false)
    if (err) {
      setError(err.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 border-b border-border bg-muted/40 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Schedule your experience
        </h2>
        <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full uppercase tracking-wide ${statusMeta.className}`}>
          {statusMeta.label}
        </span>
      </div>

      <div className="p-5">
        {existing?.scheduled_for && (
          <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
            <p className="text-sm font-medium text-blue-800">
              Scheduled for: {new Date(existing.scheduled_for).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>
        )}

        {existing?.admin_notes && (
          <div className="mb-4 rounded-lg bg-muted/60 border border-border px-4 py-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Note from CharityBid</p>
            <p className="text-sm text-foreground">{existing.admin_notes}</p>
          </div>
        )}

        {isLocked ? (
          <p className="text-sm text-muted-foreground">
            Your scheduling details have been received. We&apos;ll be in touch to confirm the final time.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                Availability *
              </label>
              <textarea
                required
                value={availability}
                onChange={e => setAvailability(e.target.value)}
                placeholder="e.g. Weekday mornings, weekends preferred. Available most days in June except June 14–17."
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                  Best email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                Timezone
              </label>
              <input
                type="text"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                Anything else we should know?
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Special requests, dietary restrictions, accessibility needs…"
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-primary text-primary-foreground font-semibold text-sm px-4 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving…' : saved ? 'Saved!' : existing ? 'Update availability' : 'Submit availability'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
