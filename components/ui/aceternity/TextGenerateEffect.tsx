'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function TextGenerateEffect({
  words,
  className,
  delay = 0,
}: {
  words: string
  className?: string
  delay?: number
}) {
  const [isReady, setIsReady] = useState(false)
  const wordArray = words.split(' ')

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100 + delay * 1000)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div className={cn(className)}>
      {wordArray.map((word, idx) => (
        <motion.span
          key={`${word}-${idx}`}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={isReady ? { opacity: 1, filter: 'blur(0px)' } : {}}
          transition={{
            duration: 0.5,
            delay: idx * 0.08,
            ease: 'easeOut',
          }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  )
}
