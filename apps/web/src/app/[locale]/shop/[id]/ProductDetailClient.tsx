'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Product = {
  id: number
  title: string
  description: string | null
  priceCents: number
  category: string | null
  stock: number | null
  images: string[] | null
}

export default function ProductDetailClient({
  product,
  shopName,
  locale,
}: {
  product: Product
  shopName: string
  locale: string
}) {
  const router = useRouter()
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleBuy = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, qty }),
      })

      const data = await res.json() as {
        clientSecret?: string
        orderId?: number
        error?: string
      }

      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }

      router.push(`/${locale}/shop/checkout?orderId=${data.orderId}`)
    } catch {
      setError('Erro ao processar. Tenta novamente.')
    }

    setLoading(false)
  }

  const totalCents = product.priceCents * qty

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button
            onClick={() => router.push(`/${locale}/shop`)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
          >←</button>
          <h1 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 700 }}>{product.title}</h1>
        </div>

        <div style={{ aspectRatio: '1', background: 'var(--surface)', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>
          {product.images && product.images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : '🛍️'}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Vendido por: {shopName}</p>
          {product.category && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Categoria: {product.category}</p>
          )}
          {product.description && (
            <p style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>{product.description}</p>
          )}
          <p style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 700 }}>
            €{(product.priceCents / 100).toFixed(2)}
          </p>
          {product.stock !== null && product.stock <= 5 && product.stock > 0 && (
            <p style={{ color: '#fbbf24', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              ⚠️ Apenas {product.stock} em stock
            </p>
          )}
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Quantidade:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => setQty((count) => Math.max(1, count - 1))}
                style={{ background: 'var(--surface-2)', border: 'none', borderRadius: '0.375rem', width: '32px', height: '32px', cursor: 'pointer', color: 'var(--text)', fontSize: '1rem' }}
              >−</button>
              <span style={{ color: 'var(--text)', minWidth: '32px', textAlign: 'center' }}>{qty}</span>
              <button
                onClick={() => setQty((count) => Math.min(product.stock ?? 99, count + 1))}
                style={{ background: 'var(--surface-2)', border: 'none', borderRadius: '0.375rem', width: '32px', height: '32px', cursor: 'pointer', color: 'var(--text)', fontSize: '1rem' }}
              >+</button>
            </div>
          </div>
          {error && <p style={{ color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}
          <button
            onClick={() => void handleBuy()}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'A processar...' : `Comprar — €${(totalCents / 100).toFixed(2)}`}
          </button>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', marginTop: '0.5rem' }}>
            🔒 Pagamento seguro via Stripe · Direito de devolução: 14 dias
          </p>
        </div>
      </div>
    </div>
  )
}