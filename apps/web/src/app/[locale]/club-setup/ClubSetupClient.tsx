'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ExistingClub = {
  id: number
  name: string
  description: string
  address: string | null
} | null

export default function ClubSetupClient({
  locale,
  existingClub,
}: {
  locale: string
  existingClub: ExistingClub
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState(existingClub?.name ?? '')
  const [description, setDescription] = useState(existingClub?.description ?? '')
  const [address, setAddress] = useState(existingClub?.address ?? '')
  const [amenities, setAmenities] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const amenitiesList = amenities
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          address,
          amenities: amenitiesList,
        }),
      })

      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        throw new Error(data.error ?? 'Não foi possível criar o clube.')
      }

      setSuccess(true)
      router.push(`/${locale}/dashboard`)
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => router.push(`/${locale}/dashboard`)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
          >
            ←
          </button>
          <h1 style={{ color: 'var(--text)', fontSize: '1.35rem', fontWeight: 700 }}>🏛️ Configurar Swing Club</h1>
        </div>

        <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Preenche os dados do teu clube para iniciares a gestão de eventos e reservas.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '1rem',
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ color: 'var(--text)', fontSize: '0.9rem' }}>Nome do clube</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex: Club Lisboa Noites"
              required
              maxLength={200}
              style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.65rem', background: 'var(--bg)', color: 'var(--text)' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ color: 'var(--text)', fontSize: '0.9rem' }}>Descrição</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descreve o ambiente e o tipo de eventos do teu clube"
              rows={4}
              maxLength={4000}
              style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.65rem', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ color: 'var(--text)', fontSize: '0.9rem' }}>Morada</span>
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Ex: Rua Exemplo 123, Lisboa"
              maxLength={500}
              style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.65rem', background: 'var(--bg)', color: 'var(--text)' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ color: 'var(--text)', fontSize: '0.9rem' }}>Amenities (separadas por vírgula)</span>
            <input
              value={amenities}
              onChange={(event) => setAmenities(event.target.value)}
              placeholder="Bar, Dance Floor, Private Rooms"
              style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.65rem', background: 'var(--bg)', color: 'var(--text)' }}
            />
          </label>

          {error && <p style={{ color: '#f87171', fontSize: '0.85rem' }}>{error}</p>}
          {success && <p style={{ color: '#4ade80', fontSize: '0.85rem' }}>Clube criado com sucesso. A redirecionar...</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.85rem', opacity: loading ? 0.75 : 1 }}
          >
            {loading ? 'A guardar...' : 'Criar clube'}
          </button>
        </form>
      </div>
    </div>
  )
}
