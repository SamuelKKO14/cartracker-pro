'use client'

export function LogoIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(25, 25)">
        <path d="M 16.5 9.5 A 19 19 0 1 0 9.5 16.5" stroke="#f97316" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
        <line x1="0" y1="0" x2="9.5" y2="-11" stroke="#f97316" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="0" cy="0" r="2.8" fill="#f97316"/>
        <circle cx="9.5" cy="-11" r="1.8" fill="#f97316"/>
      </g>
    </svg>
  )
}

export function LogoFull({ className = 'h-7' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 280 50" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: 'inherit', width: 'auto' }}>
      <g transform="translate(25, 25)">
        <path d="M 16.5 9.5 A 19 19 0 1 0 9.5 16.5" stroke="#f97316" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <line x1="0" y1="0" x2="9.5" y2="-11" stroke="#f97316" strokeWidth="3.5" strokeLinecap="round"/>
        <circle cx="0" cy="0" r="2.5" fill="#f97316"/>
        <circle cx="9.5" cy="-11" r="1.5" fill="#f97316"/>
      </g>
      <text x="55" y="33" fontFamily="system-ui,-apple-system,sans-serif" fontWeight="700" fontSize="26" fill="#f5f5f5">Car</text>
      <text x="97" y="33" fontFamily="system-ui,-apple-system,sans-serif" fontWeight="700" fontSize="26" fill="#f97316">Tracker</text>
      <rect x="210" y="18" width="38" height="18" rx="3" fill="#f97316"/>
      <text x="229" y="31" fontFamily="system-ui,-apple-system,sans-serif" fontWeight="700" fontSize="11" fill="#0a0a0a" textAnchor="middle">PRO</text>
    </svg>
  )
}
