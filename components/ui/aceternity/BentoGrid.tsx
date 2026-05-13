'use client'
import { cn } from '@/lib/utils'

export function BentoGrid({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
        className
      )}
    >
      {children}
    </div>
  )
}

export function BentoCard({
  className,
  title,
  description,
  icon,
  header,
  children,
}: {
  className?: string
  title?: string
  description?: string
  icon?: React.ReactNode
  header?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]',
        className
      )}
    >
      {header && <div className="mb-4">{header}</div>}
      <div className="relative z-10">
        {icon && (
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
            {icon}
          </div>
        )}
        {title && (
          <h3 className="mb-1.5 text-base font-semibold text-white">{title}</h3>
        )}
        {description && (
          <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
        )}
        {children}
      </div>
    </div>
  )
}
