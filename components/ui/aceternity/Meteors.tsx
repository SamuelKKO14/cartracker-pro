'use client'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

export function Meteors({ count = 20, className }: { count?: number; className?: string }) {
  const meteors = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${Math.random() * 3 + 2}s`,
      size: Math.random() * 1 + 0.5,
    }))
  }, [count])

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {meteors.map((m) => (
        <span
          key={m.id}
          className="absolute animate-meteor"
          style={{
            top: '-5%',
            left: m.left,
            animationDelay: m.delay,
            animationDuration: m.duration,
            width: `${m.size}px`,
            height: `${m.size}px`,
          }}
        >
          <span
            className="absolute w-[1px] bg-gradient-to-b from-orange-400/60 to-transparent"
            style={{ height: `${40 + Math.random() * 60}px`, top: '100%' }}
          />
        </span>
      ))}
      <style jsx>{`
        @keyframes meteor {
          0% {
            transform: translateY(0) translateX(0) rotate(215deg);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateY(600px) translateX(-300px) rotate(215deg);
            opacity: 0;
          }
        }
        .animate-meteor {
          animation: meteor linear infinite;
          background: linear-gradient(135deg, #f97316, #fbbf24);
          border-radius: 50%;
        }
      `}</style>
    </div>
  )
}
