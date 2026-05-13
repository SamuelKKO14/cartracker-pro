'use client'
import { cn } from '@/lib/utils'

export function AnimatedGradientText({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-block bg-clip-text text-transparent animate-gradient-text bg-[length:300%_100%]',
        className
      )}
      style={{
        backgroundImage:
          'linear-gradient(90deg, #f97316, #fbbf24, #fb923c, #f97316)',
      }}
    >
      {children}
      <style jsx>{`
        @keyframes gradient-text {
          0% { background-position: 0% center; }
          100% { background-position: 300% center; }
        }
        .animate-gradient-text {
          animation: gradient-text 6s linear infinite;
        }
      `}</style>
    </span>
  )
}
