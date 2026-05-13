'use client'
import { useEffect, useMemo } from 'react'
import { motion, stagger, useAnimate } from 'framer-motion'
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
  const [scope, animate] = useAnimate()
  const wordArray = useMemo(() => words.split(' '), [words])

  useEffect(() => {
    animate(
      'span',
      { opacity: 1, filter: 'blur(0px)' },
      { duration: 0.4, delay: stagger(0.08, { startDelay: delay }) }
    )
  }, [animate, delay])

  return (
    <div ref={scope} className={cn(className)}>
      {wordArray.map((word, idx) => (
        <motion.span
          key={`${word}-${idx}`}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, filter: 'blur(8px)' }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  )
}
