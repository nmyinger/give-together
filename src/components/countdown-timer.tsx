'use client'

import { useCountdown } from '@/hooks/use-countdown'
import { cn } from '@/lib/utils'

interface CountdownTimerProps {
  endTime: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function CountdownTimer({ endTime, className, size = 'md' }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isExpired, isUrgent } = useCountdown(endTime)

  if (isExpired) {
    return (
      <span className={cn('text-muted-foreground font-medium', className)}>
        Ended
      </span>
    )
  }

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl font-bold tabular-nums',
  }

  const display =
    days > 0
      ? `${days}d ${hours}h`
      : hours > 0
      ? `${hours}h ${minutes}m`
      : `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`

  return (
    <span
      className={cn(
        'font-mono transition-colors',
        sizeClasses[size],
        isUrgent ? 'text-red-400 animate-pulse' : 'text-foreground',
        className
      )}
    >
      {display}
    </span>
  )
}
