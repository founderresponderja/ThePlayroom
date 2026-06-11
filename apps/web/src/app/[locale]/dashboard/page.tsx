import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage({ params }: { params: { locale: string } }) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <h1 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>🍍 Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Bem-vindo ao The Playroom.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link href={`/${params.locale}/feed`} style={{ display: 'block', background: 'var(--primary)', borderRadius: '0.75rem', padding: '1rem', color: 'white', textDecoration: 'none', fontWeight: 600 }}>
            🍍 Ir para o feed
          </Link>
          <Link href={`/${params.locale}/matches`} style={{ display: 'block', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem', color: 'var(--text)', textDecoration: 'none' }}>
            💬 Os meus matches
          </Link>
          <Link href={`/${params.locale}/profile`} style={{ display: 'block', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem', color: 'var(--text)', textDecoration: 'none' }}>
            👤 Ver o meu perfil
          </Link>
          <Link href={`/${params.locale}/profile/edit`} style={{ display: 'block', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem', color: 'var(--text)', textDecoration: 'none' }}>
            ✏️ Editar perfil e fotos
          </Link>
          <Link href={`/${params.locale}/kink-test`} style={{ display: 'block', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem', color: 'var(--text)', textDecoration: 'none' }}>
            🍍 The Kink Test
          </Link>
        </div>
      </div>
    </div>
  )
}
