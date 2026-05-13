'use client'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

export function GlowingStarsBackground({
  className,
  starCount = 50,
  children,
}: {
  className?: string
  starCount?: number
  children?: React.ReactNode
}) {
  const stars = useMemo(() => {
    return Array.from({ length: starCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 2,
      opacity: Math.random() * 0.5 + 0.2,
    }))
  }, [starCount])

  return (
    <div className={cn('relative overflow-hidden bg-[#06090f]', className)}>
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full animate-glow-pulse"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.id % 5 === 0 ? '#f97316' : '#94a3b8',
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
            opacity: star.opacity,
            boxShadow: star.id % 5 === 0
              ? '0 0 6px rgba(249,115,22,0.6)'
              : '0 0 4px rgba(148,163,184,0.3)',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        .animate-glow-pulse {
          animation: glow-pulse ease-in-out infinite;
        }
      `}</style>
      <div className="relative z-10">{children}</div>
    </div>
  )
}
