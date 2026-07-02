'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Verification = {
  id: number
  type: string
  status: string
}

type Props = {
  currentLevel: string
  verifications: Verification[]
  locale: string
}

const LEVEL_INFO = {
  none: { label: 'Não verificado', badge: '○', color: 'var(--text-muted)' },
  photo: { label: 'Verificado por foto', badge: '✅', color: '#4ade80' },
  video: { label: 'Verificado por vídeo', badge: '🎥', color: '#60a5fa' },
  social: { label: 'Verificado por rede social', badge: '🔗', color: '#a78bfa' },
}

export default function VerificationClient({ currentLevel, verifications, locale }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const photoVerification = verifications.find((v) => v.type === 'photo')
  const videoVerification = verifications.find((v) => v.type === 'video')

  const levelInfo = LEVEL_INFO[currentLevel as keyof typeof LEVEL_INFO] ?? LEVEL_INFO.none

  const handlePhotoUpload = async (file: File) => {
    setUploading(true)
    setError('')
    try {
      const urlRes = await fetch('/api/verifications/photo-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type }),
      })
      const { uploadUrl, key } = (await urlRes.json()) as { uploadUrl: string; key: string }

      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      const verRes = await fetch('/api/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'photo', evidenceRef: key }),
      })

      if (!verRes.ok) {
        const data = (await verRes.json()) as { error: string }
        throw new Error(data.error)
      }

      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao submeter verificação')
    }
    setUploading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => router.push(`/${locale}/profile`)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
          >←</button>
          <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700 }}>✅ Verificação</h1>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Nível actual</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{levelInfo.badge}</span>
            <span style={{ color: levelInfo.color, fontWeight: 600 }}>{levelInfo.label}</span>
          </div>
        </div>

        <div style={{ background: 'var(--surface-2)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            A verificação aumenta a confiança da comunidade no teu perfil. Utilizadores verificados recebem mais matches e têm acesso a eventos exclusivos.
          </p>
        </div>

        <div style={{ background: 'var(--surface)', border: `1px solid ${currentLevel !== 'none' ? '#4ade80' : 'var(--border)'}`, borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 600 }}>✅ Nível 1 — Verificação por foto</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Tira uma selfie com um gesto específico para confirmar que és real.</p>
            </div>
            {currentLevel !== 'none' && (
              <span style={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0, marginLeft: '1rem' }}>Completo</span>
            )}
          </div>

          {photoVerification?.status === 'pending' && (
            <div style={{ background: 'var(--surface-2)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.75rem' }}>
              <p style={{ color: '#fbbf24', fontSize: '0.85rem' }}>⏳ Em análise — a nossa equipa vai rever a tua selfie em breve.</p>
            </div>
          )}

          {submitted && (
            <div style={{ background: 'var(--surface-2)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.75rem' }}>
              <p style={{ color: '#4ade80', fontSize: '0.85rem' }}>✅ Selfie enviada! Em análise.</p>
            </div>
          )}

          {error && (
            <p style={{ color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>
          )}

          {currentLevel === 'none' && !photoVerification && !submitted && (
            <>
              <div style={{ background: 'var(--surface-2)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.75rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>📋 Instruções:</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>1. Tira uma selfie clara do teu rosto</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>2. Faz um polegar para cima 👍 visível</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>3. Assegura boa iluminação</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handlePhotoUpload(file)
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="btn-primary"
                style={{ width: '100%', padding: '0.875rem', opacity: uploading ? 0.7 : 1 }}
              >
                {uploading ? 'A enviar...' : '📸 Enviar selfie'}
              </button>
            </>
          )}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1rem', opacity: currentLevel === 'none' ? 0.5 : 1 }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>🎥 Nível 2 — Verificação por vídeo (opcional)</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>Grava um vídeo curto de 5 segundos do teu rosto. Aumenta significativamente a confiança no teu perfil.</p>
          {currentLevel === 'none' ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>🔒 Requer verificação por foto primeiro.</p>
          ) : videoVerification?.status === 'pending' ? (
            <p style={{ color: '#fbbf24', fontSize: '0.85rem' }}>⏳ Em análise.</p>
          ) : currentLevel === 'video' ? (
            <p style={{ color: '#4ade80', fontSize: '0.85rem' }}>✅ Verificação por vídeo completa.</p>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Em breve — contacta support@theplayroom.pt para solicitar verificação por vídeo.</p>
          )}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem', opacity: currentLevel === 'none' ? 0.5 : 1 }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>🔗 Nível 3 — Rede social (opcional)</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>Liga uma rede social para um sinal de confiança adicional. Guardamos apenas o mínimo necessário.</p>
          {currentLevel === 'none' ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>🔒 Requer verificação por foto primeiro.</p>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Em breve.</p>
          )}
        </div>
      </div>
    </div>
  )
}
