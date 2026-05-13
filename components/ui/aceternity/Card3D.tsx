'use client'
import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function Card3D({
  className,
  children,
  intensity = 10,
}: {
  className?: string
  children: React.ReactNode
  intensity?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const x = (e.clientY - centerY) / (rect.height / 2)
      const y = (e.clientX - centerX) / (rect.width / 2)
      setRotateX(-x * intensity)
      setRotateY(y * intensity)
    },
    [intensity]
  )

  const handleMouseLeave = useCallback(() => {
    setRotateX(0)
    setRotateY(0)
  }, [])

  return (
    <div style={{ perspective: '1000px' }}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{ rotateX, rotateY }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={cn(
          'rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl',
          className
        )}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div style={{ transform: 'translateZ(20px)' }}>{children}</div>
      </motion.div>
    </div>
  )
}
