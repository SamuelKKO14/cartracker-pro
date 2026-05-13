'use client'
import { useEffect, useRef, useState } from 'react'
import { useInView, useMotionValue, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

export function NumberTicker({
  value,
  direction = 'up',
  className,
  delay = 0,
  prefix = '',
  suffix = '',
  decimalPlaces = 0,
}: {
  value: number
  direction?: 'up' | 'down'
  className?: string
  delay?: number
  prefix?: string
  suffix?: string
  decimalPlaces?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const motionValue = useMotionValue(direction === 'down' ? value : 0)
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 20,
    duration: 2000,
  })
  const [display, setDisplay] = useState(direction === 'down' ? value : 0)

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        motionValue.set(direction === 'down' ? 0 : value)
      }, delay * 1000)
      return () => clearTimeout(timer)
    }
  }, [isInView, motionValue, value, direction, delay])

  useEffect(() => {
    const unsubscribe = springValue.on('change', (v) => {
      setDisplay(parseFloat(v.toFixed(decimalPlaces)))
    })
    return unsubscribe
  }, [springValue, decimalPlaces])

  return (
    <span ref={ref} className={cn('tabular-nums tracking-tight', className)}>
      {prefix}
      {Intl.NumberFormat('fr-FR').format(display)}
      {suffix}
    </span>
  )
}
