'use client'
import { useRouter } from 'next/navigation'

type Conversation = {
  threadId: number
  otherUser: {
    id: number
    displayName: string
    primaryPhoto: string | null
    verificationLevel: string
  }
}

export default function ConversationsList({
  conversations,
  locale,
}: {
  conversations: Conversation[]
  locale: string
}) {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => router.push(`/${locale}/dashboard`)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
          >←</button>
          <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700 }}>💬 Mensagens</h1>
        </div>

        {conversations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍍</div>
            <p style={{ color: 'var(--text-muted)' }}>Ainda não tens conversas.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Faz match com alguém para começar a conversar.
            </p>
            <button
              onClick={() => router.push(`/${locale}/feed`)}
              className="btn-primary"
              style={{ marginTop: '1.5rem', padding: '0.875rem 1.5rem' }}
            >
              Ir para o feed
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {conversations.map(conv => (
            <div
              key={conv.threadId}
              onClick={() => router.push(`/${locale}/messages/${conv.otherUser.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '0.75rem', padding: '1rem', cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
            >
              {conv.otherUser.primaryPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={conv.otherUser.primaryPhoto}
                  alt={conv.otherUser.displayName}
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                  🍍
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <p style={{ color: 'var(--text)', fontWeight: 600 }}>{conv.otherUser.displayName}</p>
                  {conv.otherUser.verificationLevel !== 'none' && (
                    <span style={{ fontSize: '0.75rem' }}>✅</span>
                  )}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.1rem' }}>
                  🔒 Encriptada ponta-a-ponta
                </p>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '1.25rem' }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
