'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const COUNTRY_FLAGS: Record<string, string> = {
  FR: '🇫🇷', DE: '🇩🇪', BE: '🇧🇪', NL: '🇳🇱', ES: '🇪🇸',
  IT: '🇮🇹', PL: '🇵🇱', PT: '🇵🇹', RO: '🇷🇴', AT: '🇦🇹',
  CH: '🇨🇭', SE: '🇸🇪', NO: '🇳🇴', LT: '🇱🇹', CZ: '🇨🇿', HU: '🇭🇺',
}
const COUNTRY_NAMES: Record<string, string> = {
  FR: 'France', DE: 'Allemagne', BE: 'Belgique', NL: 'Pays-Bas',
  ES: 'Espagne', IT: 'Italie', PL: 'Pologne', PT: 'Portugal',
  RO: 'Roumanie', AT: 'Autriche', CH: 'Suisse', SE: 'Suède',
  NO: 'Norvège', LT: 'Lituanie', CZ: 'Tchéquie', HU: 'Hongrie',
}

interface ListingPhoto { id: string; url: string; position: number }
interface ShareListing {
  id: string; brand: string; model: string | null; year: number | null
  km: number | null; price: number | null; fuel: string | null
  gearbox: string | null; country: string | null; body: string | null
  listing_photos: ListingPhoto[] | null
}
interface ShareResponse { listing_id: string; reaction: string; comment: string | null }
interface ShareData {
  share: { title: string | null; message: string | null }
  listings: ShareListing[]
  responses: ShareResponse[]
}

function PhotoCarousel({ photos }: { photos: ListingPhoto[] }) {
  const [idx, setIdx] = useState(0)
  const sorted = [...photos].sort((a, b) => a.position - b.position)
  if (sorted.length === 0) return (
    <div style={{ height: 200, background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568', fontSize: 40 }}>
      📷
    </div>
  )
  return (
    <div style={{ position: 'relative', height: 200, background: '#0d1117', overflow: 'hidden' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={sorted[idx].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      {sorted.length > 1 && (
        <>
          <button onClick={() => setIdx(i => (i - 1 + sorted.length) % sorted.length)}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>‹</button>
          <button onClick={() => setIdx(i => (i + 1) % sorted.length)}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}>›</button>
          <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
            {sorted.map((_, i) => (
              <div key={i} onClick={() => setIdx(i)} style={{ width: 6, height: 6, borderRadius: '50%', background: i === idx ? '#f97316' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ListingCard({ listing, existing, token }: { listing: ShareListing; existing: ShareResponse | undefined; token: string }) {
  const [reaction, setReaction] = useState<string | null>(existing?.reaction ?? null)
  const [comment, setComment] = useState(existing?.comment ?? '')
  const [showComment, setShowComment] = useState(!!existing)
  const [sent, setSent] = useState(!!existing)
  const [sending, setSending] = useState(false)
  const photos = (listing.listing_photos ?? []).sort((a, b) => a.position - b.position)
  const flag = listing.country ? COUNTRY_FLAGS[listing.country] : ''
  const countryName = listing.country ? COUNTRY_NAMES[listing.country] : ''
  const fmt = (n: number | null, suffix: string) => n == null ? null : new Intl.NumberFormat('fr-FR').format(n) + suffix

  async function handleSend() {
    if (!reaction) return
    setSending(true)
    try {
      await fetch(`/api/share/${token}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listing.id, reaction, comment }),
      })
      setSent(true)
    } finally { setSending(false) }
  }

  return (
    <div style={{ background: '#0d1117', border: '1px solid #1a1f2e', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
      <PhotoCarousel photos={photos} />
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>
          {listing.brand} {listing.model ?? ''}
        </div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
          {listing.year ?? ''}{listing.body ? ` · ${listing.body}` : ''}
        </div>
        {listing.price != null && (
          <div style={{ fontSize: 26, fontWeight: 800, color: '#f97316', marginBottom: 12 }}>
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(listing.price)}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {listing.km != null && <span style={{ background: '#1a1f2e', color: '#94a3b8', borderRadius: 20, padding: '4px 10px', fontSize: 12 }}>📍 {fmt(listing.km, ' km')}</span>}
          {listing.fuel && <span style={{ background: '#1a1f2e', color: '#94a3b8', borderRadius: 20, padding: '4px 10px', fontSize: 12 }}>⛽ {listing.fuel}</span>}
          {listing.gearbox && <span style={{ background: '#1a1f2e', color: '#94a3b8', borderRadius: 20, padding: '4px 10px', fontSize: 12 }}>⚙️ {listing.gearbox}</span>}
          {countryName && <span style={{ background: '#1a1f2e', color: '#94a3b8', borderRadius: 20, padding: '4px 10px', fontSize: 12 }}>{flag} {countryName}</span>}
        </div>
        <div style={{ borderTop: '1px solid #1a1f2e', paddingTop: 14 }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '12px 0', color: reaction === 'interested' ? '#4ade80' : '#94a3b8', fontWeight: 600, fontSize: 14 }}>
              {reaction === 'interested' ? '✅ Réponse envoyée — Intéressé(e)' : '✅ Réponse envoyée — Pas pour moi'}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <button onClick={() => { setReaction('interested'); setShowComment(true) }}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: reaction === 'interested' ? '2px solid #f97316' : '1px solid #1a1f2e', background: reaction === 'interested' ? 'rgba(249,115,22,0.15)' : '#1a1f2e', color: reaction === 'interested' ? '#f97316' : '#94a3b8', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  ✅ Intéressé(e)
                </button>
                <button onClick={() => { setReaction('not_interested'); setShowComment(true) }}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: reaction === 'not_interested' ? '2px solid #ef4444' : '1px solid #1a1f2e', background: reaction === 'not_interested' ? 'rgba(239,68,68,0.15)' : '#1a1f2e', color: reaction === 'not_interested' ? '#ef4444' : '#94a3b8', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  ❌ Pas pour moi
                </button>
              </div>
              {showComment && (
                <>
                  <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2}
                    placeholder="Commentaire optionnel…"
                    style={{ width: '100%', background: '#06090f', border: '1px solid #1a1f2e', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#f1f5f9', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 8 }} />
                  <button onClick={handleSend} disabled={sending}
                    style={{ width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', background: '#f97316', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: sending ? 0.7 : 1 }}>
                    {sending ? 'Envoi…' : 'Envoyer ma réponse'}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<ShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/share/${token}`)
      .then(r => r.json())
      .then(json => { if (json.error) setError(json.error); else setData(json) })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [token])

  const pageStyle = { minHeight: '100vh', background: '#06090f', color: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }
  const innerStyle = { maxWidth: 600, margin: '0 auto', padding: '0 16px 48px' }

  if (loading) return (
    <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#64748b', fontSize: 15 }}>Chargement…</div>
    </div>
  )

  if (error || !data) return (
    <div style={{ ...pageStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 40 }}>🔗</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>Lien introuvable</div>
      <div style={{ fontSize: 14, color: '#64748b' }}>{error ?? 'Ce lien n\'existe pas ou a été supprimé.'}</div>
    </div>
  )

  return (
    <div style={pageStyle}>
      <div style={innerStyle}>
        <header style={{ padding: '24px 0 20px', borderBottom: '1px solid #1a1f2e', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🚗</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f97316' }}>CarTracker Pro</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                {data.listings.length} véhicule{data.listings.length > 1 ? 's' : ''} sélectionné{data.listings.length > 1 ? 's' : ''} pour vous
              </div>
            </div>
          </div>
        </header>

        {data.share.message && (
          <div style={{ background: '#0d1117', border: '1px solid #1a1f2e', borderLeft: '3px solid #f97316', borderRadius: 12, padding: '14px 16px', marginBottom: 20, fontSize: 14, color: '#cbd5e1', lineHeight: 1.6 }}>
            {data.share.message}
          </div>
        )}

        {data.listings.map(listing => {
          const existing = data.responses.find(r => r.listing_id === listing.id)
          return <ListingCard key={listing.id} listing={listing} existing={existing} token={token} />
        })}

        <footer style={{ textAlign: 'center', fontSize: 12, color: '#334155', paddingTop: 24, borderTop: '1px solid #1a1f2e', marginTop: 8 }}>
          Sélection préparée par votre conseiller automobile
        </footer>
      </div>
    </div>
  )
}
