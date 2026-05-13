'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function AnimatedList({
  children,
  className,
  delay = 0.1,
}: {
  children: React.ReactNode[]
  className?: string
  delay?: number
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <AnimatePresence>
        {children.map((child, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{
              duration: 0.3,
              delay: i * delay,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
