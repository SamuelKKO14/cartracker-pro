export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#06090f', minHeight: '100vh', color: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {children}
    </div>
  )
}
