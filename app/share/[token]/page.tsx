'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { COUNTRY_LABELS } from '@/lib/utils'

const S = {
  // Layout
  page: { maxWidth: 600, margin: '0 auto', padding: '0 16px 40px' },
  header: { padding: '20px 0 16px', borderBottom: '1px solid #f0f0f0', marginBottom: 20 },
  logo: { fontSize: 20, fontWeight: 700, color: '#f97316' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  message: { background: '#fff8f5', border: '1px solid #fde8d8', borderRadius: 12, padding: '14px 16px', marginBottom: 20, fontSize: 14, color: '#1a1a1a', lineHeight: 1.6 },
  footer: { textAlign: 'center' as const, fontSize: 12, color: '#aaa', paddingTop: 32, borderTop: '1px solid #f0f0f0', marginTop: 32 },

  // Card
  card: { borderRadius: 16, border: '1px solid #ebebeb', marginBottom: 20, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardBody: { padding: 16 },
  carTitle: { fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 },
  carSub: { fontSize: 13, color: '#888', marginBottom: 12 },
  price: { fontSize: 24, fontWeight: 800, color: '#f97316', marginBottom: 12 },
  pills: { display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 12 },
  pill: { background: '#f5f5f5', borderRadius: 20, padding: '4px 10px', fontSize: 12, color: '#555' },

  // Photo carousel
  photoWrap: { position: 'relative' as const, background: '#f5f5f5', height: 220, overflow: 'hidden' },
  photoPlaceholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc', fontSize: 48 },
  carouselBtn: { position: 'absolute' as const, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.35)', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  photoDots: { display: 'flex', justifyContent: 'center', gap: 6, padding: '8px 0 0' },

  // Reaction
  reactionWrap: { marginTop: 12, borderTop: '1px solid #f0f0f0', paddingTop: 12 },
  reactionBtns: { display: 'flex', gap: 10, marginBottom: 10 },
  btnInterested: { flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: '#dcfce7', color: '#166534', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  btnNotInterested: { flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: '#f5f5f5', color: '#666', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  btnSelected: { outline: '2px solid #f97316' },
  commentInput: { width: '100%', borderRadius: 10, border: '1px solid #e0e0e0', padding: '10px 12px', fontSize: 14, resize: 'none' as const, boxSizing: 'border-box' as const, fontFamily: 'inherit', marginBottom: 8 },
  btnSend: { width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', background: '#f97316', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  sentBadge: { textAlign: 'center' as const, padding: '12px 0', color: '#16a34a', fontWeight: 600, fontSize: 14 },
}

interface ListingPhoto { id: string; url: string; position: number }
interface ShareListing {
  id: string
  brand: string
  model: string | null
  year: number | null
  km: number | null
  price: number | null
  fuel: string | null
  gearbox: string | null
  country: string | null
  body: string | null
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
  if (photos.length === 0) return (
    <div style={S.photoWrap}>
      <div style={S.photoPlaceholder}>📷</div>
    </div>
  )
  const sorted = [...photos].sort((a, b) => a.position - b.position)
  return (
    <div>
      <div style={S.photoWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sorted[idx].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {sorted.length > 1 && (
          <>
            <button style={{ ...S.carouselBtn, left: 10 }} onClick={() => setIdx(i => (i - 1 + sorted.length) % sorted.length)}>‹</button>
            <button style={{ ...S.carouselBtn, right: 10 }} onClick={() => setIdx(i => (i + 1) % sorted.length)}>›</button>
          </>
        )}
      </div>
      {sorted.length > 1 && (
        <div style={S.photoDots}>
          {sorted.map((_, i) => (
            <div key={i} onClick={() => setIdx(i)} style={{ width: 6, height: 6, borderRadius: '50%', background: i === idx ? '#f97316' : '#ddd', cursor: 'pointer' }} />
          ))}
        </div>
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
  const countryLabel = listing.country ? COUNTRY_LABELS[listing.country] : null

  function fmt(n: number | null, suffix: string) {
    if (n == null) return null
    return new Intl.NumberFormat('fr-FR').format(n) + suffix
  }

  function handleReact(r: string) {
    setReaction(r)
    setShowComment(true)
  }

  async function handleSend() {
    if (!reaction) return
    setSending(true)
    try {
      await fetch(`/api/share/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listing.id, reaction, comment }),
      })
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={S.card}>
      <PhotoCarousel photos={photos} />
      <div style={S.cardBody}>
        <div style={S.carTitle}>{listing.brand} {listing.model ?? ''}</div>
        <div style={S.carSub}>{listing.year ?? ''}</div>

        {listing.price != null && (
          <div style={S.price}>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(listing.price)}</div>
        )}

        <div style={S.pills}>
          {listing.km != null && <span style={S.pill}>📍 {fmt(listing.km, ' km')}</span>}
          {listing.fuel && <span style={S.pill}>⛽ {listing.fuel}</span>}
          {listing.gearbox && <span style={S.pill}>⚙️ {listing.gearbox}</span>}
          {countryLabel && <span style={S.pill}>{countryLabel}</span>}
          {listing.body && <span style={S.pill}>{listing.body}</span>}
        </div>

        <div style={S.reactionWrap}>
          {sent ? (
            <div style={S.sentBadge}>
              {reaction === 'interested' ? '✅ Réponse envoyée — Intéressé(e)' : '✅ Réponse envoyée — Pas pour moi'}
            </div>
          ) : (
            <>
              <div style={S.reactionBtns}>
                <button
                  style={{ ...S.btnInterested, ...(reaction === 'interested' ? S.btnSelected : {}) }}
                  onClick={() => handleReact('interested')}
                >✅ Je suis intéressé(e)</button>
                <button
                  style={{ ...S.btnNotInterested, ...(reaction === 'not_interested' ? S.btnSelected : {}) }}
                  onClick={() => handleReact('not_interested')}
                >❌ Pas pour moi</button>
              </div>
              {showComment && (
                <>
                  <textarea
                    style={S.commentInput}
                    placeholder="Commentaire optionnel (question, remarque…)"
                    rows={2}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                  />
                  <button style={S.btnSend} onClick={handleSend} disabled={sending}>
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
      .then(json => {
        if (json.error) setError(json.error)
        else setData(json)
      })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ color: '#999', fontSize: 15 }}>Chargement…</div>
    </div>
  )

  if (error || !data) return (
    <div style={{ ...S.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 40 }}>🔗</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>Lien introuvable</div>
      <div style={{ fontSize: 14, color: '#888' }}>{error ?? 'Ce lien n\'existe pas ou a été supprimé.'}</div>
    </div>
  )

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={S.logo}>🚗 CarTracker Pro</div>
        <div style={S.subtitle}>{data.share.title ?? 'Votre sélection de véhicules'}</div>
      </header>

      {data.share.message && (
        <div style={S.message}>{data.share.message}</div>
      )}

      {data.listings.map(listing => {
        const existing = data.responses.find(r => r.listing_id === listing.id)
        return <ListingCard key={listing.id} listing={listing} existing={existing} token={token} />
      })}

      <footer style={S.footer}>
        Sélection préparée par votre conseiller automobile
      </footer>
    </div>
  )
}
