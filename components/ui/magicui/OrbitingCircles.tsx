'use client'
import { cn } from '@/lib/utils'

export function OrbitingCircles({
  children,
  className,
  radius = 160,
  duration = 20,
  reverse = false,
  startAngle = 0,
}: {
  children: React.ReactNode
  className?: string
  radius?: number
  duration?: number
  reverse?: boolean
  startAngle?: number
}) {
  const id = `orbit-${radius}-${startAngle}`

  return (
    <div
      className={cn(
        'absolute flex items-center justify-center',
        className
      )}
      style={{
        width: '40px',
        height: '40px',
        animation: `${id} ${duration}s linear infinite${reverse ? ' reverse' : ''}`,
      }}
    >
      {children}
      <style jsx>{`
        @keyframes ${id} {
          from {
            transform: rotate(${startAngle}deg) translateX(${radius}px) rotate(-${startAngle}deg);
          }
          to {
            transform: rotate(${startAngle + 360}deg) translateX(${radius}px) rotate(-${startAngle + 360}deg);
          }
        }
      `}</style>
    </div>
  )
}
