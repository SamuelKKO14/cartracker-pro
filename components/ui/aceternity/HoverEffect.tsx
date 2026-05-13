'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function HoverEffect({
  items,
  className,
}: {
  items: { title: string; description: string; icon?: React.ReactNode; link?: string }[]
  className?: string
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2', className)}>
      {items.map((item, idx) => (
        <div
          key={idx}
          className="relative group p-2"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 bg-white/[0.05] rounded-2xl"
                layoutId="hover-bg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            )}
          </AnimatePresence>
          <div className="relative z-10 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 h-full transition-colors duration-200 group-hover:border-white/[0.12]">
            {item.icon && (
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                {item.icon}
              </div>
            )}
            <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
