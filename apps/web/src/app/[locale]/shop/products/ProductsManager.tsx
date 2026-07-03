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
  active: boolean | null
  moderationStatus: string | null
}

type Shop = { id: number; name: string }

const STATUS_COLORS: Record<string, string> = {
  pending: '#fbbf24',
  approved: '#4ade80',
  rejected: '#f87171',
}

export default function ProductsManager({
  shop,
  products: initialProducts,
  locale,
}: {
  shop: Shop
  products: Product[]
  locale: string
}) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    priceCents: '',
    category: '',
    stock: '0',
  })

  const CATEGORIES = [
    'Vibradores', 'Massajadores', 'Kits casais', 'Acessórios BDSM',
    'Lubrificantes', 'Lingerie', 'Jogos', 'Outros',
  ]

  const handleCreate = async () => {
    if (!form.title || !form.priceCents) return
    setSaving(true)
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        description: form.description || '',
        priceCents: Math.round(parseFloat(form.priceCents) * 100),
        category: form.category || '',
        stock: parseInt(form.stock) || 0,
      }),
    })

    if (!res.ok) {
      setSaving(false)
      return
    }

    const product = await res.json() as Product
    setProducts(prev => [product, ...prev])
    setForm({ title: '', description: '', priceCents: '', category: '', stock: '0' })
    setShowForm(false)
    setSaving(false)
  }

  const handleToggleActive = async (product: Product) => {
    const res = await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !product.active }),
    })

    if (!res.ok) return

    const updated = await res.json() as Product
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p))
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => router.push(`/${locale}/shop-setup`)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}>←</button>
            <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700 }}>📦 {shop.name} — Produtos</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
            style={{ padding: '0.625rem 1.25rem', fontSize: '0.85rem' }}
          >
            + Adicionar produto
          </button>
        </div>

        {showForm && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ color: 'var(--text)', fontSize: '1rem', marginBottom: '1rem' }}>Novo produto</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                placeholder="Nome do produto *"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.75rem', color: 'var(--text)', fontSize: '0.9rem' }}
              />
              <textarea
                placeholder="Descrição"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.75rem', color: 'var(--text)', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  placeholder="Preço (€) *"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.priceCents}
                  onChange={e => setForm(f => ({ ...f, priceCents: e.target.value }))}
                  style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.75rem', color: 'var(--text)', fontSize: '0.9rem' }}
                />
                <input
                  placeholder="Stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.75rem', color: 'var(--text)', fontSize: '0.9rem' }}
                />
              </div>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.75rem', color: 'var(--text)', fontSize: '0.9rem' }}
              >
                <option value="">Selecciona uma categoria</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                ⚠️ O produto será revisto pela nossa equipa antes de ser publicado.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => void handleCreate()}
                  disabled={saving || !form.title || !form.priceCents}
                  className="btn-primary"
                  style={{ flex: 1, padding: '0.75rem', opacity: saving || !form.title || !form.priceCents ? 0.7 : 1 }}
                >
                  {saving ? 'A guardar...' : 'Guardar produto'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="btn-outline"
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {products.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <p style={{ color: 'var(--text-muted)' }}>Ainda não tens produtos.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>{'Clica em "Adicionar produto" para começar.'}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {products.map(product => (
            <div
              key={product.id}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <p style={{ color: 'var(--text)', fontWeight: 600 }}>{product.title}</p>
                    <span style={{
                      color: STATUS_COLORS[product.moderationStatus ?? 'pending'],
                      fontSize: '0.7rem', padding: '1px 6px',
                      borderRadius: '999px',
                      background: 'var(--surface-2)',
                    }}>
                      {product.moderationStatus ?? 'pending'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.95rem' }}>
                    €{(product.priceCents / 100).toFixed(2)}
                  </p>
                  {product.category && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{product.category}</p>
                  )}
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Stock: {product.stock ?? 0}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                  <button
                    onClick={() => void handleToggleActive(product)}
                    style={{
                      background: product.active ? '#14532d' : 'var(--surface-2)',
                      color: product.active ? '#4ade80' : 'var(--text-muted)',
                      border: 'none', borderRadius: '0.5rem',
                      padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.75rem',
                    }}
                  >
                    {product.active ? '● Activo' : '○ Inactivo'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}