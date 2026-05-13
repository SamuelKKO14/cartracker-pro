'use client'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function TypingAnimation({
  text,
  className,
  speed = 50,
  delay = 0,
}: {
  text: string
  className?: string
  speed?: number
  delay?: number
}) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const delayTimer = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(delayTimer)
  }, [delay])

  useEffect(() => {
    if (!started) return
    let i = 0
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
      } else {
        clearInterval(interval)
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed, started])

  return (
    <span className={cn(className)}>
      {displayed}
      {displayed.length < text.length && started && (
        <span className="animate-pulse ml-0.5">|</span>
      )}
    </span>
  )
}
