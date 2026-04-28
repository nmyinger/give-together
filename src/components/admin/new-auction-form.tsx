'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface NewAuctionFormProps {
  adminKey: string
}

export function NewAuctionForm({ adminKey }: NewAuctionFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    celebrity_name: '',
    celebrity_title: '',
    description: '',
    charity_name: '',
    charity_website: '',
    image_url: '',
    starting_price: '100',
    min_increment: '10',
    end_days: '7',
    featured: false,
  })

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/auction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminKey}`,
          },
          body: JSON.stringify({
            ...form,
            starting_price: Math.round(parseFloat(form.starting_price) * 100),
            min_increment: Math.round(parseFloat(form.min_increment) * 100),
            end_days: parseInt(form.end_days),
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error ?? 'Failed to create auction')
          return
        }
        toast.success('Auction created!')
        router.push(`/admin?key=${adminKey}`)
      } catch {
        toast.error('Network error')
      }
    })
  }

  const Field = ({ label, id, type = 'text', placeholder = '', textarea = false, value, onChange }: {
    label: string; id: string; type?: string; placeholder?: string;
    textarea?: boolean; value: string; onChange: (v: string) => void
  }) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[10px] text-muted-foreground uppercase tracking-widest">{label}</label>
      {textarea ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-white/10 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[var(--gold)]/50 resize-none"
          required
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-transparent border-white/10 focus:border-[var(--gold)]/50"
          required={type !== 'url'}
        />
      )}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-white/8 bg-card p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Celebrity Name" id="celebrity_name" value={form.celebrity_name} onChange={(v) => set('celebrity_name', v)} placeholder="Alex Hormozi" />
        <Field label="Title / Role" id="celebrity_title" value={form.celebrity_title} onChange={(v) => set('celebrity_title', v)} placeholder="Founder of Acquisition.com" />
      </div>
      <Field label="Description" id="description" textarea value={form.description} onChange={(v) => set('description', v)} placeholder="What the winner gets…" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Charity Name" id="charity_name" value={form.charity_name} onChange={(v) => set('charity_name', v)} placeholder="GiveDirectly" />
        <Field label="Charity Website (optional)" id="charity_website" type="url" value={form.charity_website} onChange={(v) => set('charity_website', v)} placeholder="https://givedirectly.org" />
      </div>
      <Field label="Image URL" id="image_url" type="url" value={form.image_url} onChange={(v) => set('image_url', v)} placeholder="https://images.unsplash.com/..." />
      <div className="grid grid-cols-3 gap-4">
        <Field label="Starting Price ($)" id="starting_price" type="number" value={form.starting_price} onChange={(v) => set('starting_price', v)} placeholder="100" />
        <Field label="Min Increment ($)" id="min_increment" type="number" value={form.min_increment} onChange={(v) => set('min_increment', v)} placeholder="10" />
        <Field label="Duration (days)" id="end_days" type="number" value={form.end_days} onChange={(v) => set('end_days', v)} placeholder="7" />
      </div>
      <div className="flex items-center gap-2.5">
        <input
          id="featured"
          type="checkbox"
          checked={form.featured}
          onChange={(e) => set('featured', e.target.checked)}
          className="w-4 h-4 rounded accent-[var(--gold)]"
        />
        <label htmlFor="featured" className="text-sm text-muted-foreground">Feature this auction on the homepage</label>
      </div>
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="text-muted-foreground"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-[var(--gold)] text-[oklch(0.11_0.010_255)] hover:bg-[var(--gold)]/90 font-bold"
        >
          {isPending ? 'Creating…' : 'Create Auction'}
        </Button>
      </div>
    </form>
  )
}
