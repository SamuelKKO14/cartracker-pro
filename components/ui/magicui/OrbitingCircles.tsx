'use client'
import { cn } from '@/lib/utils'

export function OrbitingCircles({
  children,
  className,
  radius = 160,
  duration = 20,
  reverse = false,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  radius?: number
  duration?: number
  reverse?: boolean
  delay?: number
}) {
  return (
    <div
      className={cn(
        'absolute flex items-center justify-center animate-orbit',
        reverse && '[animation-direction:reverse]',
        className
      )}
      style={
        {
          '--radius': `${radius}px`,
          '--duration': `${duration}s`,
          '--delay': `${-delay}s`,
          width: '40px',
          height: '40px',
          transform: `rotate(0deg) translateX(var(--radius)) rotate(0deg)`,
        } as React.CSSProperties
      }
    >
      {children}
      <style jsx>{`
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(var(--radius)) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(var(--radius)) rotate(-360deg);
          }
        }
        .animate-orbit {
          animation: orbit var(--duration) linear var(--delay) infinite;
        }
      `}</style>
    </div>
  )
}
