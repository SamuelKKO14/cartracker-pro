'use client'
import { cn } from '@/lib/utils'

export function ShimmerButton({
  children,
  className,
  shimmerColor = '#fbbf24',
  shimmerSize = '0.1em',
  background = 'linear-gradient(135deg, #f97316, #ea580c)',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  shimmerColor?: string
  shimmerSize?: string
  background?: string
}) {
  return (
    <button
      className={cn(
        'group relative inline-flex items-center justify-center overflow-hidden rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]',
        'shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_40px_rgba(249,115,22,0.4)]',
        className
      )}
      style={{ background }}
      {...props}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 30%, black 70%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 30%, black 70%, transparent)',
        }}
      >
        <div
          className="animate-shimmer absolute inset-y-0 w-1/2"
          style={{
            background: `linear-gradient(90deg, transparent, ${shimmerColor}40, transparent)`,
          }}
        />
      </div>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(400%); }
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>
    </button>
  )
}
