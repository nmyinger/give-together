import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format cents to a human-readable dollar string.
 * e.g. 150000 → "$1,500"
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

/**
 * Format a future date into a countdown object.
 */
export function getTimeLeft(endTime: string | Date) {
  const end = new Date(endTime).getTime()
  const now = Date.now()
  const diff = end - now

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, isUrgent: false }
  }

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  const isUrgent = diff < 5 * 60 * 1000

  return { days, hours, minutes, seconds, isExpired: false, isUrgent }
}

/**
 * Format a time-left result as a display string.
 * e.g. "2d 4h" or "3m 22s"
 */
export function formatTimeLeft(endTime: string | Date): string {
  const { days, hours, minutes, seconds, isExpired } = getTimeLeft(endTime)
  if (isExpired) return 'Ended'
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m ${seconds}s`
}

/**
 * Format a timestamp as a relative time string.
 */
export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  const seconds = Math.floor(diff / 1000)

  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return d.toLocaleDateString()
}
