'use client'
import { useEffect, useRef } from 'react'

/* ─────────────────────────────────────────────────────────────────────────────
   Premium CSS/SVG Car Hero — replaces Three.js scene for zero CPU overhead.
   Auto-rotating car silhouette with glow, floating particles, and reflections.
   ───────────────────────────────────────────────────────────────────────────── */

export function CarHeroScene({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Mouse parallax for the glow
    function handleMove(e: MouseEvent) {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20
      containerRef.current.style.setProperty('--mx', `${x}px`)
      containerRef.current.style.setProperty('--my', `${y}px`)
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`} style={{ '--mx': '0px', '--my': '0px' } as React.CSSProperties}>
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[320px] h-[320px] rounded-full opacity-40 blur-[80px]"
          style={{
            background: 'radial-gradient(circle, rgba(249,115,22,0.5) 0%, rgba(251,146,60,0.2) 40%, transparent 70%)',
            transform: 'translate(var(--mx), var(--my))',
            transition: 'transform 0.3s ease-out',
          }}
        />
      </div>

      {/* Orbiting ring */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="car-orbit-ring w-[280px] h-[280px] rounded-full border border-orange-500/[0.15]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="car-orbit-ring-2 w-[340px] h-[340px] rounded-full border border-white/[0.06]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="car-particle absolute w-1 h-1 rounded-full bg-orange-400/60"
            style={{
              left: `${15 + (i * 7) % 70}%`,
              top: `${10 + (i * 11) % 80}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      {/* Main car container — rotating platform */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="car-rotate relative">
          {/* Shadow beneath */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[180px] h-[20px] rounded-full bg-orange-500/20 blur-xl car-shadow" />

          {/* Car SVG */}
          <svg viewBox="0 0 200 100" className="w-[220px] h-[110px] drop-shadow-[0_0_30px_rgba(249,115,22,0.3)]" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Body */}
            <path
              d="M20 60 Q20 50 30 50 L60 50 Q70 30 80 25 L130 25 Q145 25 150 40 L170 50 Q180 50 180 60 L180 68 Q180 72 176 72 L24 72 Q20 72 20 68 Z"
              fill="url(#bodyGrad)"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="0.5"
            />
            {/* Windshield */}
            <path
              d="M68 50 Q75 32 82 28 L125 28 Q138 28 143 40 L148 50 Z"
              fill="rgba(255,255,255,0.06)"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="0.5"
            />
            {/* Window divider */}
            <line x1="108" y1="28" x2="108" y2="50" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            {/* Headlight right */}
            <ellipse cx="175" cy="58" rx="5" ry="4" fill="#fbbf24" className="car-headlight" />
            <ellipse cx="175" cy="58" rx="8" ry="6" fill="#fbbf24" opacity="0.2" className="car-headlight-glow" />
            {/* Taillight left */}
            <ellipse cx="23" cy="58" rx="4" ry="3" fill="#ef4444" opacity="0.8" />
            <ellipse cx="23" cy="58" rx="6" ry="5" fill="#ef4444" opacity="0.15" />
            {/* Body line */}
            <path d="M35 58 L165 58" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            {/* Front wheel */}
            <circle cx="55" cy="72" r="14" fill="#111" stroke="#333" strokeWidth="1.5" />
            <circle cx="55" cy="72" r="9" fill="#1a1a1a" stroke="#444" strokeWidth="0.5" />
            <circle cx="55" cy="72" r="3" fill="#333" />
            {/* Front wheel spokes */}
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <line
                key={`fw-${angle}`}
                x1={55 + Math.cos((angle * Math.PI) / 180) * 4}
                y1={72 + Math.sin((angle * Math.PI) / 180) * 4}
                x2={55 + Math.cos((angle * Math.PI) / 180) * 8}
                y2={72 + Math.sin((angle * Math.PI) / 180) * 8}
                stroke="#444"
                strokeWidth="1"
              />
            ))}
            {/* Rear wheel */}
            <circle cx="150" cy="72" r="14" fill="#111" stroke="#333" strokeWidth="1.5" />
            <circle cx="150" cy="72" r="9" fill="#1a1a1a" stroke="#444" strokeWidth="0.5" />
            <circle cx="150" cy="72" r="3" fill="#333" />
            {/* Rear wheel spokes */}
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <line
                key={`rw-${angle}`}
                x1={150 + Math.cos((angle * Math.PI) / 180) * 4}
                y1={72 + Math.sin((angle * Math.PI) / 180) * 4}
                x2={150 + Math.cos((angle * Math.PI) / 180) * 8}
                y2={72 + Math.sin((angle * Math.PI) / 180) * 8}
                stroke="#444"
                strokeWidth="1"
              />
            ))}
            {/* Gradients */}
            <defs>
              <linearGradient id="bodyGrad" x1="20" y1="25" x2="180" y2="72" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#c2410c" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Speed lines */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`sl-${i}`}
            className="car-speed-line absolute h-px bg-gradient-to-r from-transparent via-orange-400/30 to-transparent"
            style={{
              width: `${60 + i * 15}px`,
              top: `${40 + i * 5}%`,
              left: `${10 + i * 3}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Reflection surface */}
      <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-[300px] h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <style jsx>{`
        .car-rotate {
          animation: carFloat 4s ease-in-out infinite;
        }
        .car-shadow {
          animation: shadowPulse 4s ease-in-out infinite;
        }
        .car-orbit-ring {
          animation: orbitSpin 20s linear infinite;
          border-style: dashed;
        }
        .car-orbit-ring-2 {
          animation: orbitSpin 30s linear infinite reverse;
          border-style: dotted;
        }
        .car-particle {
          animation: particleFloat 3s ease-in-out infinite;
        }
        .car-headlight {
          animation: headlightPulse 2s ease-in-out infinite;
        }
        .car-headlight-glow {
          animation: headlightPulse 2s ease-in-out infinite;
        }
        .car-speed-line {
          animation: speedLine 2s ease-in-out infinite;
        }
        @keyframes carFloat {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes shadowPulse {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scaleX(1); }
          50% { opacity: 0.3; transform: translateX(-50%) scaleX(0.85); }
        }
        @keyframes orbitSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes particleFloat {
          0%, 100% { opacity: 0; transform: translateY(0) scale(0.5); }
          50% { opacity: 1; transform: translateY(-20px) scale(1); }
        }
        @keyframes headlightPulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @keyframes speedLine {
          0%, 100% { opacity: 0; transform: translateX(0); }
          50% { opacity: 1; transform: translateX(-30px); }
        }
      `}</style>
    </div>
  )
}
