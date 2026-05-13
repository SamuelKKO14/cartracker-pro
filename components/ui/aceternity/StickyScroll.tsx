'use client'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StickyScrollItem {
  title: string
  description: string
  content: React.ReactNode
}

export function StickyScroll({
  items,
  className,
}: {
  items: StickyScrollItem[]
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {items.map((item, i) => (
        <StickyScrollSection
          key={i}
          item={item}
          index={i}
          total={items.length}
          progress={scrollYProgress}
        />
      ))}
    </div>
  )
}

function StickyScrollSection({
  item,
  index,
  total,
  progress,
}: {
  item: StickyScrollItem
  index: number
  total: number
  progress: ReturnType<typeof useScroll>['scrollYProgress']
}) {
  const start = index / total
  const end = (index + 1) / total
  const opacity = useTransform(progress, [start, start + 0.1, end - 0.1, end], [0, 1, 1, 0])
  const y = useTransform(progress, [start, start + 0.1], [40, 0])

  return (
    <div className="min-h-screen flex items-center">
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 px-4">
        <motion.div style={{ opacity, y }} className="flex flex-col justify-center">
          <span className="text-orange-400 text-sm font-medium mb-2">
            Étape {index + 1}
          </span>
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {item.title}
          </h3>
          <p className="text-lg text-gray-400 leading-relaxed">
            {item.description}
          </p>
        </motion.div>
        <motion.div
          style={{ opacity, y }}
          className="flex items-center justify-center"
        >
          {item.content}
        </motion.div>
      </div>
    </div>
  )
}
