'use client'
import { useState, useRef } from 'react'

type Photo = {
  id: number
  url: string
  isPrivate: boolean
  isPrimary: boolean
  moderationStatus: string
}

type Props = {
  photos: Photo[]
  onUploadComplete: (photo: Photo) => void
  onDelete: (photoId: number) => void
  onSetPrimary: (photoId: number) => void
}

export default function PhotoUploader({ photos, onUploadComplete, onDelete, onSetPrimary }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError('')
    setUploading(true)
    try {
      // 1. Get presigned URL
      const urlRes = await fetch('/api/photos/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, sizeMb: file.size / (1024 * 1024) }),
      })
      if (!urlRes.ok) {
        const err = (await urlRes.json()) as { error: string }
        throw new Error(err.error)
      }
      const { uploadUrl, key } = (await urlRes.json()) as { uploadUrl: string; key: string }

      // 2. Upload directly to R2
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      if (!uploadRes.ok) throw new Error('Falha no upload. Tenta novamente.')

      // 3. Confirm upload, run safety checks, and save record to DB
      const saveRes = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, isPrivate: false, isPrimary: photos.length === 0 }),
      })
      if (!saveRes.ok) {
        const err = (await saveRes.json().catch(() => null)) as { error?: string } | null
        throw new Error(err?.error ?? 'Falha ao guardar foto.')
      }
      const photo = (await saveRes.json()) as Photo
      onUploadComplete(photo)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro desconhecido')
    }
    setUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) void handleFile(file)
  }

  return (
    <div>
      {/* Photo grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
        {photos.map(photo => (
          <div
            key={photo.id}
            style={{
              position: 'relative', aspectRatio: '1', borderRadius: '0.5rem', overflow: 'hidden',
              border: photo.isPrimary ? '2px solid var(--primary)' : '1px solid var(--border)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="Profile photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {photo.isPrimary && (
              <span style={{ position: 'absolute', top: '4px', left: '4px', background: 'var(--primary)', color: 'white', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '999px' }}>
                Principal
              </span>
            )}
            {photo.isPrivate && (
              <span style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '999px' }}>
                🔒
              </span>
            )}
            {photo.moderationStatus === 'pending' && (
              <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.7)', color: '#fbbf24', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '999px' }}>
                Em revisão
              </span>
            )}
            <div style={{ position: 'absolute', bottom: '4px', right: '4px', display: 'flex', gap: '4px' }}>
              {!photo.isPrimary && (
                <button
                  onClick={() => onSetPrimary(photo.id)}
                  title="Definir como principal"
                  style={{ background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', padding: '3px 6px', fontSize: '0.7rem' }}
                >⭐</button>
              )}
              <button
                onClick={() => onDelete(photo.id)}
                title="Apagar"
                style={{ background: 'rgba(180,0,0,0.8)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', padding: '3px 6px', fontSize: '0.7rem' }}
              >✕</button>
            </div>
          </div>
        ))}

        {/* Upload slot */}
        {photos.length < 10 && (
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            style={{
              aspectRatio: '1', borderRadius: '0.5rem', border: '2px dashed var(--border)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer', background: 'var(--surface)',
              color: 'var(--text-muted)', fontSize: '0.8rem', gap: '0.5rem',
              opacity: uploading ? 0.6 : 1, transition: 'border-color 0.2s',
            }}
          >
            {uploading ? (
              <><span style={{ fontSize: '1.5rem' }}>⏳</span><span>A enviar...</span></>
            ) : (
              <><span style={{ fontSize: '1.5rem' }}>+</span><span>Adicionar foto</span></>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />

      {error && <p style={{ color: 'var(--primary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>}
      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
        Máximo 10 fotos · JPEG, PNG ou WebP · Até 10MB cada
      </p>
    </div>
  )
}
