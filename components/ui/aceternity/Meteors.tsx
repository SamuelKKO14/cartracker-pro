'use client'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

export function Meteors({ count = 5, className }: { count?: number; className?: string }) {
  const meteors = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 15}s`,
      duration: `${1.5 + Math.random()}s`,
      size: Math.random() * 1 + 0.5,
      tailHeight: 40 + Math.random() * 60,
    }))
  }, [count])

  return (
    <div
      className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
      style={{ isolation: 'isolate' }}
    >
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
            mixBlendMode: 'screen',
          }}
        >
          <span
            className="absolute w-[1px] bg-gradient-to-b from-orange-400/40 to-transparent"
            style={{ height: `${m.tailHeight}px`, top: '100%' }}
          />
        </span>
      ))}
      <style jsx>{`
        @keyframes meteor {
          0% {
            transform: translateY(0) translateX(0) rotate(215deg);
            opacity: 0;
          }
          10% {
            opacity: 0.4;
          }
          70% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(600px) translateX(-300px) rotate(215deg);
            opacity: 0;
          }
        }
        .animate-meteor {
          animation: meteor linear 2 forwards;
          background: linear-gradient(135deg, rgba(249,115,22,0.4), rgba(251,191,36,0.2));
          border-radius: 50%;
        }
      `}</style>
    </div>
  )
}
