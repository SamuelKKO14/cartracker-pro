'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

export function AnimatedCircularProgress({
  value,
  max = 100,
  size = 80,
  strokeWidth = 6,
  className,
  color = '#f97316',
  trackColor = 'rgba(255,255,255,0.08)',
  children,
}: {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  className?: string
  color?: string
  trackColor?: string
  children?: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const circumference = 2 * Math.PI * ((size - strokeWidth) / 2)
  const percentage = Math.min(value / max, 1)

  const springValue = useSpring(0, { stiffness: 60, damping: 15 })
  const [dashOffset, setDashOffset] = useState(circumference)

  useEffect(() => {
    if (isInView) {
      springValue.set(percentage)
    }
  }, [isInView, percentage, springValue])

  useEffect(() => {
    const unsubscribe = springValue.on('change', (v) => {
      setDashOffset(circumference * (1 - v))
    })
    return unsubscribe
  }, [springValue, circumference])

  const center = size / 2
  const radius = (size - strokeWidth) / 2

  return (
    <div ref={ref} className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={trackColor}
          fill="none"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-none"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}
