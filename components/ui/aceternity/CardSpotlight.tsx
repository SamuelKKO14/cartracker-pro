'use client'
import { useRef, useState, useCallback } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

const springConfig = { stiffness: 300, damping: 20, mass: 0.5 }

export function CardSpotlight({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const divRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springRotateX = useSpring(rotateX, springConfig)
  const springRotateY = useSpring(rotateY, springConfig)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!divRef.current) return
    const rect = divRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setPosition({ x, y })

    // Tilt: map mouse position to rotation (-8 to 8 degrees)
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    rotateX.set(((y - centerY) / centerY) * -8)
    rotateY.set(((x - centerX) / centerX) * 8)
  }, [rotateX, rotateY])

  const handleMouseLeave = useCallback(() => {
    setOpacity(0)
    rotateX.set(0)
    rotateY.set(0)
  }, [rotateX, rotateY])

  return (
    <div style={{ perspective: '800px' }}>
      <motion.div
        ref={divRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setOpacity(1)}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformStyle: 'preserve-3d',
        }}
        className={cn(
          'relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6',
          className
        )}
      >
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-500"
          style={{
            opacity,
            background: `radial-gradient(300px circle at ${position.x}px ${position.y}px, rgba(249,115,22,0.12), transparent 50%)`,
          }}
        />
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-500"
          style={{
            opacity,
            background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(249,115,22,0.06), transparent 50%)`,
          }}
        />
        <div className="relative z-10" style={{ transform: 'translateZ(20px)' }}>{children}</div>
      </motion.div>
    </div>
  )
}
