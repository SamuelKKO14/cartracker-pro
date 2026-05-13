'use client'
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function AnimatedBeam({
  fromRef,
  toRef,
  containerRef,
  className,
  curvature = 0,
  duration = 2,
  pathColor = 'rgba(249,115,22,0.15)',
  pathWidth = 2,
  gradientStartColor = '#f97316',
  gradientStopColor = '#fbbf24',
}: {
  fromRef: React.RefObject<HTMLElement | null>
  toRef: React.RefObject<HTMLElement | null>
  containerRef: React.RefObject<HTMLElement | null>
  className?: string
  curvature?: number
  duration?: number
  pathColor?: string
  pathWidth?: number
  gradientStartColor?: string
  gradientStopColor?: string
}) {
  const [pathD, setPathD] = useState('')
  const svgRef = useRef<SVGSVGElement>(null)
  const id = useRef(`beam-${Math.random().toString(36).slice(2, 9)}`)

  useEffect(() => {
    function updatePath() {
      if (!fromRef.current || !toRef.current || !containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      const fromRect = fromRef.current.getBoundingClientRect()
      const toRect = toRef.current.getBoundingClientRect()

      const x1 = fromRect.left + fromRect.width / 2 - containerRect.left
      const y1 = fromRect.top + fromRect.height / 2 - containerRect.top
      const x2 = toRect.left + toRect.width / 2 - containerRect.left
      const y2 = toRect.top + toRect.height / 2 - containerRect.top

      const midX = (x1 + x2) / 2
      const midY = (y1 + y2) / 2 + curvature

      setPathD(`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`)
    }
    updatePath()
    window.addEventListener('resize', updatePath)
    return () => window.removeEventListener('resize', updatePath)
  }, [fromRef, toRef, containerRef, curvature])

  if (!pathD) return null

  return (
    <svg
      ref={svgRef}
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
      fill="none"
    >
      <path d={pathD} stroke={pathColor} strokeWidth={pathWidth} />
      <path
        d={pathD}
        stroke={`url(#${id.current})`}
        strokeWidth={pathWidth}
        strokeLinecap="round"
      >
        <animate
          attributeName="stroke-dasharray"
          from="0 1000"
          to="1000 0"
          dur={`${duration}s`}
          repeatCount="indefinite"
        />
      </path>
      <defs>
        <linearGradient id={id.current} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={gradientStartColor} stopOpacity="0" />
          <stop offset="50%" stopColor={gradientStartColor} stopOpacity="1" />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}
