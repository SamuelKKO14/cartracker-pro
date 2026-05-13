'use client'
import { useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

export function Spotlight({
  className,
  children,
  size = 400,
}: {
  className?: string
  children: React.ReactNode
  size?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      setOpacity(1)
    },
    []
  )

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setOpacity(0)}
      className={cn('relative overflow-hidden', className)}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(${size}px circle at ${position.x}px ${position.y}px, rgba(249,115,22,0.08), transparent 60%)`,
        }}
      />
      {children}
    </div>
  )
}
