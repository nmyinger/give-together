'use client'

import { useCountdown } from '@/hooks/use-countdown'
import { cn } from '@/lib/utils'

interface CountdownTimerProps {
  endTime: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function CountdownTimer({ endTime, className, size = 'md' }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isExpired, isUrgent } = useCountdown(endTime)

  if (isExpired) {
    return (
      <span className={cn('text-muted-foreground font-medium text-sm', className)}>
        Ended
      </span>
    )
  }

  if (size === 'xl') {
    // Segmented display for the bidding room hero
    const segments =
      days > 0
        ? [
            { value: String(days).padStart(2, '0'), label: 'd' },
            { value: String(hours).padStart(2, '0'), label: 'h' },
            { value: String(minutes).padStart(2, '0'), label: 'm' },
          ]
        : hours > 0
        ? [
            { value: String(hours).padStart(2, '0'), label: 'h' },
            { value: String(minutes).padStart(2, '0'), label: 'm' },
            { value: String(seconds).padStart(2, '0'), label: 's' },
          ]
        : [
            { value: String(minutes).padStart(2, '0'), label: 'm' },
            { value: String(seconds).padStart(2, '0'), label: 's' },
          ]

    return (
      <div
        className={cn(
          'flex items-end gap-1.5',
          className
        )}
        style={isUrgent ? { animation: 'urgent-pulse 1.4s ease-in-out infinite' } : undefined}
      >
        {segments.map((seg, i) => (
          <span key={seg.label} className="flex items-start">
            {i > 0 && (
              <span
                className={cn(
                  'text-2xl font-light mb-1 mx-0.5',
                  isUrgent ? 'text-red-400/70' : 'text-muted-foreground/40'
                )}
              >
                :
              </span>
            )}
            <span className="flex flex-col items-center">
              <span
                className={cn(
                  'font-mono font-bold tabular-nums leading-none',
                  isUrgent ? 'text-red-400' : 'text-foreground',
                  days > 0 ? 'text-3xl' : 'text-4xl'
                )}
                style={isUrgent ? { textShadow: '0 0 20px oklch(0.65 0.20 22 / 0.6)' } : undefined}
              >
                {seg.value}
              </span>
              <span className={cn(
                'text-[9px] uppercase tracking-widest mt-0.5',
                isUrgent ? 'text-red-400/50' : 'text-muted-foreground/50'
              )}>
                {seg.label}
              </span>
            </span>
          </span>
        ))}
      </div>
    )
  }

  const display =
    days > 0
      ? `${days}d ${hours}h`
      : hours > 0
      ? `${hours}h ${minutes}m`
      : `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`

  const sizeClasses = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-semibold',
    lg: 'text-2xl font-bold',
  }

  return (
    <span
      className={cn(
        'font-mono tabular-nums transition-colors',
        sizeClasses[size],
        isUrgent ? 'text-red-400' : 'text-foreground',
        className
      )}
      style={isUrgent ? {
        textShadow: '0 0 12px oklch(0.65 0.20 22 / 0.5)',
        animation: 'urgent-pulse 1.4s ease-in-out infinite'
      } : undefined}
    >
      {display}
    </span>
  )
}
