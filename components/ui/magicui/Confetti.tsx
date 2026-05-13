'use client'
import confetti from 'canvas-confetti'

const defaults = {
  spread: 360,
  ticks: 80,
  gravity: 1,
  decay: 0.94,
  startVelocity: 30,
  colors: ['#f97316', '#fbbf24', '#fb923c', '#10b981', '#3b82f6'],
}

export function fireConfetti(preset: 'success' | 'celebration' | 'win' = 'success') {
  switch (preset) {
    case 'success':
      confetti({
        ...defaults,
        particleCount: 60,
        origin: { y: 0.7 },
      })
      break
    case 'celebration':
      const duration = 3000
      const end = Date.now() + duration
      const frame = () => {
        confetti({
          ...defaults,
          particleCount: 3,
          origin: { x: Math.random(), y: Math.random() * 0.3 },
        })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
      break
    case 'win':
      confetti({
        ...defaults,
        particleCount: 120,
        spread: 100,
        origin: { y: 0.6 },
        startVelocity: 45,
      })
      setTimeout(() => {
        confetti({
          ...defaults,
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        })
        confetti({
          ...defaults,
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        })
      }, 300)
      break
  }
}
