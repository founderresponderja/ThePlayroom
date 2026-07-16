'use client'

import Image from 'next/image'
import { useState } from 'react'

type PhotoItem = {
  id: number
  url: string
  displayName: string
  accountType: string
  createdAt: string
  reviewPriority?: string | null
  safeSearchCategories?: Record<string, string> | null
  safeSearchReason?: string | null
}

export default function ModerationQueue({ initialPhotos }: { initialPhotos: PhotoItem[] }) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [actioningId, setActioningId] = useState<number | null>(null)

  const handleAction = async (photoId: number, moderationStatus: 'approved' | 'rejected') => {
    setActioningId(photoId)
    try {
      const res = await fetch(`/api/admin/photos/${photoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moderationStatus }),
      })
      if (!res.ok) throw new Error('Failed to update photo')
      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId))
    } finally {
      setActioningId(null)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
      {photos.map((photo) => (
        <div key={photo.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden' }}>
          <div style={{ position: 'relative', width: '100%', height: '180px' }}>
            <Image src={photo.url} alt={photo.displayName} fill unoptimized style={{ objectFit: 'cover' }} />
          </div>
          <div style={{ padding: '0.9rem' }}>
            <div style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '0.25rem' }}>{photo.displayName}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{photo.accountType}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{photo.createdAt?.slice(0, 10)}</div>
            {photo.reviewPriority === 'high' && (
              <div style={{ color: '#b45309', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Prioridade alta
              </div>
            )}
            {photo.safeSearchCategories && Object.keys(photo.safeSearchCategories).length > 0 && (
              <div style={{ marginBottom: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <div style={{ marginBottom: '0.25rem', fontWeight: 600 }}>SafeSearch (contexto):</div>
                {Object.entries(photo.safeSearchCategories).map(([key, value]) => (
                  <div key={key}>{key}: {String(value)}</div>
                ))}
                {photo.safeSearchReason ? <div>reason: {photo.safeSearchReason}</div> : null}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleAction(photo.id, 'approved')}
                disabled={actioningId === photo.id}
                style={{ flex: 1, padding: '0.55rem', border: 'none', borderRadius: '0.5rem', background: 'var(--primary)', color: 'white', cursor: 'pointer' }}
              >
                ✅ Aprovar
              </button>
              <button
                onClick={() => handleAction(photo.id, 'rejected')}
                disabled={actioningId === photo.id}
                style={{ flex: 1, padding: '0.55rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}
              >
                ❌ Rejeitar
              </button>
            </div>
          </div>
        </div>
      ))}
      {photos.length === 0 && (
        <div style={{ gridColumn: '1 / -1', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem', color: 'var(--text-muted)' }}>
          Nenhuma foto pendente.
        </div>
      )}
    </div>
  )
}
