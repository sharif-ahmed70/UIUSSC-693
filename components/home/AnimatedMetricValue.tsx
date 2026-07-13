'use client'

import { useEffect, useRef, useState } from 'react'

export default function AnimatedMetricValue({ value }: { value: number }){
  const [displayValue, setDisplayValue] = useState(0)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()
    const duration = 850

    const tick = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(value * eased))

      if(progress < 1){
        frameRef.current = requestAnimationFrame(tick)
      }
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if(frameRef.current){
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [value])

  return <>{displayValue.toLocaleString()}</>
}
