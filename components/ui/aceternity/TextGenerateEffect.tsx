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
        <span key={idx} className="inline-block whitespace-nowrap">
          <motion.span
            className="inline-block"
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
          {idx < wordArray.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </div>
  )
}
