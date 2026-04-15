'use client'

import { useState, useEffect, useRef } from 'react'
import { getTimeLeft } from '@/lib/utils'

export function useCountdown(endTime: string) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(endTime))
  const prevEndTime = useRef(endTime)

  useEffect(() => {
    // Recalculate immediately when endTime changes (popcorn extension)
    if (prevEndTime.current !== endTime) {
      prevEndTime.current = endTime
      setTimeLeft(getTimeLeft(endTime))
    }

    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(endTime))
    }, 1000)

    return () => clearInterval(interval)
  }, [endTime])

  return timeLeft
}
