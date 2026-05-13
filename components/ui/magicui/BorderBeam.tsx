'use client'
import { cn } from '@/lib/utils'

export function BorderBeam({
  className,
  size = 200,
  duration = 6,
  delay = 0,
  colorFrom = '#f97316',
  colorTo = '#fbbf24',
}: {
  className?: string
  size?: number
  duration?: number
  delay?: number
  colorFrom?: string
  colorTo?: string
}) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden', className)}
    >
      <div
        className="absolute animate-border-beam"
        style={
          {
            '--size': `${size}px`,
            '--duration': `${duration}s`,
            '--delay': `${delay}s`,
            width: 'var(--size)',
            height: 'var(--size)',
            background: `linear-gradient(to right, ${colorFrom}, ${colorTo})`,
            borderRadius: '50%',
            filter: 'blur(20px)',
            opacity: 0.6,
            top: '-50%',
            left: '-50%',
          } as React.CSSProperties
        }
      />
      <style jsx>{`
        @keyframes border-beam {
          0% { top: -50%; left: -50%; }
          25% { top: -50%; left: 100%; }
          50% { top: 100%; left: 100%; }
          75% { top: 100%; left: -50%; }
          100% { top: -50%; left: -50%; }
        }
        .animate-border-beam {
          animation: border-beam var(--duration) linear var(--delay) infinite;
        }
      `}</style>
    </div>
  )
}
