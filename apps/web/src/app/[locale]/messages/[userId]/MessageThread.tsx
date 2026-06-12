'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Ably from 'ably'
import { useKeypair } from '@/hooks/useKeypair'
import { encryptMessage, decryptMessage } from '@/lib/crypto'

type Message = {
  id: number
  threadId: number     // messages.threadId is integer (serial FK)
  senderId: number
  encryptedPayload: string
  createdAt: string | null
  decryptedText?: string
}

type Props = {
  currentUserId: number
  currentClerkId: string
  otherUserId: number
  otherDisplayName: string
  otherPublicKey: string | null
}

export default function MessageThread({
  currentUserId,
  currentClerkId,
  otherUserId,
  otherDisplayName,
  otherPublicKey,
}: Props) {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const { keypair, ready } = useKeypair(currentClerkId)
  // threads.id is serial (integer) — store as number
  const [threadId, setThreadId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [ablyClient, setAblyClient] = useState<Ably.Realtime | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Get or create thread
  useEffect(() => {
    const initThread = async () => {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId }),
      })
      // threads.id is integer (serial), not string
      const thread = (await res.json()) as { id: number }
      setThreadId(thread.id)
    }
    void initThread()
  }, [otherUserId])

  // Load existing messages
  useEffect(() => {
    if (!threadId || !keypair) return

    const loadMessages = async () => {
      const res = await fetch(`/api/messages?threadId=${threadId}`)
      const data = (await res.json()) as Message[]

      // Decrypt each message
      const decrypted = await Promise.all(
        data.map(async msg => {
          if (msg.senderId === currentUserId) {
            return { ...msg, decryptedText: '(mensagem enviada)' }
          }
          const text = await decryptMessage(
            msg.encryptedPayload,
            keypair.publicKey,
            keypair.privateKey,
          )
          return { ...msg, decryptedText: text ?? '(não foi possível desencriptar)' }
        }),
      )
      setMessages(decrypted)
    }

    void loadMessages()
  }, [threadId, keypair, currentUserId])

  // Connect to Ably for real-time
  useEffect(() => {
    if (!threadId) return

    const initAbly = async () => {
      const tokenRes = await fetch('/api/ably-token')
      const tokenRequest = (await tokenRes.json()) as Ably.TokenRequest

      const client = new Ably.Realtime({
        authCallback: (_data, callback) => {
          callback(null, tokenRequest)
        },
      })

      const channel = client.channels.get(`thread:${threadId}`)
      await channel.subscribe('message', msg => {
        const newMsg = msg.data as Message
        if (newMsg.senderId !== currentUserId && keypair) {
          void decryptMessage(newMsg.encryptedPayload, keypair.publicKey, keypair.privateKey).then(
            text => {
              setMessages(prev => [...prev, { ...newMsg, decryptedText: text ?? '(erro)' }])
            },
          )
        }
      })

      setAblyClient(client)
    }

    void initAbly()

    return () => {
      ablyClient?.close()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !threadId || !otherPublicKey || !keypair || sending) return

    setSending(true)
    const text = input.trim()
    setInput('')

    // Encrypt with recipient's public key (sealed-box: only they can decrypt)
    const encryptedPayload = await encryptMessage(text, otherPublicKey)

    // Persist to DB
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId, encryptedPayload }),
    })
    const saved = (await res.json()) as Message

    // Show locally as sent (sealed-box: sender can't re-decrypt their own message)
    setMessages(prev => [...prev, { ...saved, decryptedText: text }])

    // Publish to Ably channel for real-time delivery
    if (ablyClient) {
      const channel = ablyClient.channels.get(`thread:${threadId}`)
      await channel.publish('message', saved)
    }

    setSending(false)
  }

  // ── Waiting for crypto init ──────────────────────────────────────────────────
  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>A inicializar encriptação... 🔒</p>
      </div>
    )
  }

  // ── Other user hasn't set up E2E yet ─────────────────────────────────────────
  if (!otherPublicKey) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>
          {otherDisplayName} ainda não configurou a encriptação. Tenta novamente mais tarde.
        </p>
      </div>
    )
  }

  // ── Thread UI ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <button
          onClick={() => router.push(`/${locale}/matches`)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
        >←</button>
        <div>
          <p style={{ color: 'var(--text)', fontWeight: 600 }}>{otherDisplayName}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>🔒 Encriptação ponta-a-ponta</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <p>🍍 Início da conversa</p>
            <p style={{ marginTop: '0.5rem' }}>As mensagens são encriptadas ponta-a-ponta.</p>
          </div>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: msg.senderId === currentUserId ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{
              maxWidth: '70%',
              background: msg.senderId === currentUserId ? 'var(--primary)' : 'var(--surface)',
              color: msg.senderId === currentUserId ? 'white' : 'var(--text)',
              padding: '0.625rem 0.875rem',
              borderRadius: msg.senderId === currentUserId ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
              fontSize: '0.9rem',
              border: msg.senderId === currentUserId ? 'none' : '1px solid var(--border)',
            }}>
              {msg.decryptedText}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', gap: '0.75rem' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void handleSend()
            }
          }}
          placeholder="Escreve uma mensagem..."
          style={{
            flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: '1.5rem', padding: '0.625rem 1rem', color: 'var(--text)',
            fontSize: '0.9rem', outline: 'none',
          }}
        />
        <button
          onClick={() => void handleSend()}
          disabled={!input.trim() || sending}
          style={{
            background: 'var(--primary)', border: 'none', borderRadius: '50%',
            width: '40px', height: '40px', cursor: 'pointer', fontSize: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: !input.trim() || sending ? 0.5 : 1,
          }}
        >➤</button>
      </div>
    </div>
  )
}
