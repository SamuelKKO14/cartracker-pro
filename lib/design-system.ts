// CarTracker Pro — Design System Tokens
// Shared across Aceternity, Magic UI, and Three.js components

export const colors = {
  bg: {
    base: '#06090f',
    elevated: '#0a0e16',
    glass: 'rgba(255,255,255,0.03)',
    card: '#0d1117',
  },
  border: {
    subtle: 'rgba(255,255,255,0.08)',
    bright: 'rgba(255,255,255,0.12)',
    default: '#1a1f2e',
    hover: '#2a2f3e',
  },
  accent: {
    primary: '#f97316',
    secondary: '#fb923c',
    glow: '#fbbf24',
  },
  status: {
    success: '#10b981',
    danger: '#ef4444',
  },
  text: {
    primary: '#f1f5f9',
    secondary: '#94a3b8',
    muted: '#64748b',
    faint: '#475569',
  },
} as const

export const gradients = {
  hero: 'linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fbbf24 100%)',
  glassCard: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
  textPremium: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
  orangeSubtle: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(251,146,60,0.05))',
  darkVignette: 'radial-gradient(ellipse at center, transparent 0%, #06090f 70%)',
} as const

export const shadows = {
  glowOrange: '0 0 40px rgba(249,115,22,0.3)',
  glowOrangeLg: '0 0 80px rgba(249,115,22,0.2)',
  glassCard: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
  elevated: '0 4px 24px rgba(0,0,0,0.3)',
  subtle: '0 2px 8px rgba(0,0,0,0.2)',
} as const

export const animation = {
  easing: {
    premium: [0.16, 1, 0.3, 1] as const,
    smooth: [0.4, 0, 0.2, 1] as const,
    bounce: [0.34, 1.56, 0.64, 1] as const,
  },
  duration: {
    micro: 0.2,
    normal: 0.4,
    slow: 0.6,
    hero: 0.8,
    stagger: 0.05,
  },
  spring: {
    gentle: { type: 'spring' as const, stiffness: 100, damping: 15 },
    snappy: { type: 'spring' as const, stiffness: 300, damping: 20 },
    bouncy: { type: 'spring' as const, stiffness: 400, damping: 10 },
  },
} as const

export const glass = {
  card: {
    background: gradients.glassCard,
    backdropFilter: 'blur(12px)',
    border: `1px solid ${colors.border.subtle}`,
    borderRadius: '16px',
  },
  panel: {
    background: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(8px)',
    border: `1px solid ${colors.border.subtle}`,
    borderRadius: '12px',
  },
} as const

// Tailwind class helpers
export const tw = {
  glassCard: 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl',
  glassPanel: 'bg-white/[0.02] backdrop-blur-lg border border-white/[0.08] rounded-xl',
  glassInput: 'bg-[#1a1f2e] border border-[#2a2f3e] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/60 transition-colors',
  accentGlow: 'shadow-[0_0_40px_rgba(249,115,22,0.3)]',
  textGradient: 'bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent',
  textOrangeGradient: 'bg-gradient-to-r from-orange-400 via-orange-500 to-amber-400 bg-clip-text text-transparent',
} as const
