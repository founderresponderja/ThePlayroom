import Link from 'next/link'

export default function LegalIndexPage({ params }: { params: { locale: string } }) {
  const links = [
    { href: 'terms', label: '📋 Termos de Uso' },
    { href: 'privacy', label: '🔒 Política de Privacidade / RGPD' },
    { href: 'cookies', label: '🍪 Política de Cookies' },
    { href: 'guidelines', label: '🤝 Regras da Comunidade' },
    { href: 'seller-terms', label: '🛍️ Termos de Vendedor' },
  ]

  return (
    <div>
      <h1 style={{ color: 'var(--text)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Documentos Legais
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>
        © Amplia Solutions 2026 · legal@theplayroom.pt
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={`/${params.locale}/legal/${link.href}`}
            style={{
              display: 'block',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '1rem',
              color: 'var(--text)',
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
