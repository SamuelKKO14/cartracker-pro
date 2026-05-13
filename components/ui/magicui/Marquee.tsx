'use client'
import { cn } from '@/lib/utils'

export function Marquee({
  children,
  className,
  reverse = false,
  pauseOnHover = true,
  speed = 40,
}: {
  children: React.ReactNode
  className?: string
  reverse?: boolean
  pauseOnHover?: boolean
  speed?: number
}) {
  return (
    <div
      className={cn(
        'group flex overflow-hidden [--gap:1rem] gap-[var(--gap)]',
        pauseOnHover && '[&:hover_.marquee-track]:pause',
        className
      )}
    >
      {[0, 1].map((i) => (
        <div
          key={i}
          className="marquee-track flex shrink-0 gap-[var(--gap)]"
          style={{
            animation: `marquee ${speed}s linear infinite ${reverse ? 'reverse' : ''}`,
          }}
          aria-hidden={i === 1}
        >
          {children}
        </div>
      ))}
      <style jsx>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(calc(-100% - var(--gap))); }
        }
        .pause {
          animation-play-state: paused !important;
        }
      `}</style>
    </div>
  )
}
