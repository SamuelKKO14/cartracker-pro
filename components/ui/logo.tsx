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

export function LogoFull({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg className="w-8 h-8 shrink-0" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(25, 25)">
          <path d="M 16.5 9.5 A 19 19 0 1 0 9.5 16.5" stroke="#f97316" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          <line x1="0" y1="0" x2="9.5" y2="-11" stroke="#f97316" strokeWidth="4" strokeLinecap="round"/>
          <circle cx="0" cy="0" r="2.8" fill="#f97316"/>
          <circle cx="9.5" cy="-11" r="1.8" fill="#f97316"/>
        </g>
      </svg>
      <span className="font-bold text-white text-base whitespace-nowrap">Car<span className="text-orange-400">Tracker</span><span className="ml-1 text-[10px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded">PRO</span></span>
    </div>
  )
}
