'use client'
import { useState } from 'react'

type Verification = {
  id: number
  type: string
  status: string
  evidenceRef: string | null
  createdAt: string | null
  user: {
    id: number
    displayName: string | null
    accountType: string | null
  }
}

export default function VerificationQueue({
  verifications: initial,
  locale,
}: {
  verifications: Verification[]
  locale: string
}) {
  const [items, setItems] = useState(initial)
  const [loading, setLoading] = useState<number | null>(null)
  const [error, setError] = useState('')

  const handleAction = async (id: number, status: 'approved' | 'rejected') => {
    setLoading(id)
    setError('')
    try {
      const res = await fetch(`/api/admin/verifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        throw new Error(data.error ?? 'Falha ao atualizar verificação')
      }

      setItems((prev) => prev.filter((v) => v.id !== id))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Erro inesperado.')
    }
    setLoading(null)
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        ✅ Fila de verificações ({items.length})
      </h1>

      {error && (
        <p style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</p>
      )}

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p>🍍 Sem verificações pendentes.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {items.map((v) => (
          <div key={v.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <p style={{ color: 'var(--text)', fontWeight: 600 }}>{v.user.displayName ?? 'Sem nome'}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{v.user.accountType ?? '—'} · Tipo: {v.type}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {v.createdAt ? new Date(v.createdAt).toLocaleDateString('pt-PT') : '—'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => void handleAction(v.id, 'approved')}
                  disabled={loading === v.id}
                  style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem', opacity: loading === v.id ? 0.7 : 1 }}
                >
                  ✅ Aprovar
                </button>
                <button
                  onClick={() => void handleAction(v.id, 'rejected')}
                  disabled={loading === v.id}
                  style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem', opacity: loading === v.id ? 0.7 : 1 }}
                >
                  ❌ Rejeitar
                </button>
              </div>
            </div>
            {v.evidenceRef && (
              <div style={{ background: 'var(--surface-2)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Evidência:</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${process.env.NEXT_PUBLIC_MEDIA_CDN_URL ?? 'https://media.example.invalid'}/${v.evidenceRef}`}
                  alt="Verification evidence"
                  style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', borderRadius: '0.5rem' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
