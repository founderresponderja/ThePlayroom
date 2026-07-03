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
  shopName: string
}

const CATEGORIES = [
  'Todos', 'Vibradores', 'Massajadores', 'Kits casais',
  'Acessórios BDSM', 'Lubrificantes', 'Lingerie', 'Jogos', 'Outros',
]

export default function StorefrontClient({
  products,
  locale,
}: {
  products: Product[]
  locale: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')

  const filtered = products.filter((product) => {
    const matchesSearch = search === '' ||
      product.title.toLowerCase().includes(search.toLowerCase()) ||
      (product.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchesCategory = category === 'Todos' || product.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => router.push(`/${locale}/dashboard`)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
          >←</button>
          <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700 }}>🛍️ Marketplace</h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            placeholder="Pesquisar produtos..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              flex: 1, minWidth: '200px', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: '0.5rem',
              padding: '0.625rem 1rem', color: 'var(--text)', fontSize: '0.9rem',
            }}
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '0.5rem', padding: '0.625rem 1rem',
              color: 'var(--text)', fontSize: '0.9rem',
            }}
          >
            {CATEGORIES.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛍️</div>
            <p style={{ color: 'var(--text-muted)' }}>
              {products.length === 0 ? 'Marketplace em breve.' : 'Nenhum produto encontrado.'}
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {filtered.map((product) => (
            <div
              key={product.id}
              onClick={() => router.push(`/${locale}/shop/${product.id}`)}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '0.75rem', overflow: 'hidden', cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ aspectRatio: '1', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                {product.images && product.images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : '🛍️'}
              </div>
              <div style={{ padding: '0.875rem' }}>
                <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{product.title}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{product.shopName}</p>
                {product.category && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{product.category}</p>
                )}
                <p style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1rem' }}>
                  €{(product.priceCents / 100).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}