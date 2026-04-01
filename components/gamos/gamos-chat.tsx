'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, X, MessageCircle } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }

const WELCOME = 'Bonjour ! Je suis Gamos 🚗 Votre assistant CarTracker Pro. Je suis là pour vous aider à utiliser l\'outil et vous conseiller sur votre activité automobile. Comment puis-je vous aider ?'

export function GamosChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: WELCOME }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const res = await fetch('/api/gamos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply ?? 'Désolé, une erreur est survenue.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Erreur de connexion. Réessayez.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f97316, #ea580c)',
          border: 'none', cursor: 'pointer', fontSize: 24,
          boxShadow: '0 4px 24px rgba(249,115,22,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s',
        }}
        title="Gamos - Assistant CarTracker"
      >
        {open ? '✕' : '🚗'}
        {/* Badge pulsant */}
        <span style={{
          position: 'absolute', top: 4, right: 4,
          width: 10, height: 10, borderRadius: '50%',
          background: '#22c55e', border: '2px solid #06090f',
          animation: 'pulse 2s infinite',
        }} />
      </button>

      {/* Fenêtre de chat */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 24, zIndex: 9998,
          width: 350, height: 500,
          background: '#06090f', border: '1px solid #1a1f2e',
          borderRadius: 16, display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid #1a1f2e',
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#0d1117',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, fontSize: 18,
              background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>🚗</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#f97316', fontSize: 14 }}>Gamos</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Assistant CarTracker Pro</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '12px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.6,
                  background: msg.role === 'user' ? '#f97316' : '#0d1117',
                  color: msg.role === 'user' ? '#fff' : '#e2e8f0',
                  border: msg.role === 'assistant' ? '1px solid #1a1f2e' : 'none',
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 12,
                  borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 12,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '10px 13px', borderRadius: 12, background: '#0d1117', border: '1px solid #1a1f2e', borderBottomLeftRadius: 4 }}>
                  <span style={{ color: '#f97316', fontSize: 18, letterSpacing: 2 }}>···</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #1a1f2e', display: 'flex', gap: 8, background: '#0d1117' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Posez votre question…"
              style={{
                flex: 1, background: '#06090f', border: '1px solid #1a1f2e',
                borderRadius: 10, padding: '9px 12px', color: '#e2e8f0',
                fontSize: 13, outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                width: 38, height: 38, borderRadius: 10, border: 'none',
                background: input.trim() && !loading ? '#f97316' : '#1a1f2e',
                color: '#fff', cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </>
  )
}
