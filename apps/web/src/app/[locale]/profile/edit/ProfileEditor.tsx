'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import PhotoUploader from '@/components/PhotoUploader'

type Photo = {
  id: number
  url: string
  isPrivate: boolean
  isPrimary: boolean
  moderationStatus: string
}

// id is number (serial PK from Drizzle); displayName/accountType are notNull strings
// but we accept string | null here so partial Drizzle select objects are assignable too
type User = { id: number; displayName: string | null; accountType: string | null }

// Drizzle types jsonb columns as `unknown`; we accept that here and cast safely inside
type Profile = { bio?: string | null; interests?: unknown } | null

export default function ProfileEditor({
  user,
  photos: initialPhotos,
  profile,
}: {
  user: User
  photos: Photo[]
  profile: Profile
}) {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [bio, setBio]       = useState(profile?.bio ?? '')

  // interests is jsonb → unknown; cast safely to string[] before joining
  const safeInterests = Array.isArray(profile?.interests)
    ? (profile.interests as string[])
    : []
  const [interests, setInterests] = useState(safeInterests.join(', '))

  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  const handleUploadComplete = (photo: Photo) => {
    setPhotos(prev => [...prev, photo])
  }

  const handleDelete = async (photoId: number) => {
    await fetch('/api/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId }),
    })
    setPhotos(prev => prev.filter(p => p.id !== photoId))
  }

  const handleSetPrimary = async (photoId: number) => {
    await fetch(`/api/photos/${photoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPrimary: true }),
    })
    setPhotos(prev => prev.map(p => ({ ...p, isPrimary: p.id === photoId })))
  }

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bio,
        interests: interests.split(',').map(s => s.trim()).filter(Boolean),
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => router.push(`/${locale}/profile`)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
          >←</button>
          <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700 }}>Editar perfil</h1>
        </div>

        {/* Photos */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1rem', marginBottom: '1rem' }}>📸 Fotos</h2>
          <PhotoUploader
            photos={photos}
            onUploadComplete={handleUploadComplete}
            onDelete={id => void handleDelete(id)}
            onSetPrimary={id => void handleSetPrimary(id)}
          />
        </section>

        {/* Bio */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1rem', marginBottom: '0.75rem' }}>✍️ Bio</h2>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Conta um pouco sobre ti e o que procuras no lifestyle..."
            style={{
              width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '0.5rem', padding: '0.875rem', color: 'var(--text)',
              fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit',
            }}
          />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'right' }}>
            {bio.length}/500
          </p>
        </section>

        {/* Interests */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1rem', marginBottom: '0.5rem' }}>🏷️ Interesses</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            Separa por vírgulas (ex: viagens, música, lifestyle)
          </p>
          <input
            type="text"
            value={interests}
            onChange={e => setInterests(e.target.value)}
            placeholder="viagens, música, lifestyle..."
            style={{
              width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '0.5rem', padding: '0.875rem', color: 'var(--text)', fontSize: '0.9rem',
            }}
          />
        </section>

        {/* Save */}
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="btn-primary"
          style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', opacity: saving ? 0.7 : 1 }}
        >
          {saved ? '✅ Guardado!' : saving ? 'A guardar...' : 'Guardar alterações'}
        </button>
      </div>
    </div>
  )
}
