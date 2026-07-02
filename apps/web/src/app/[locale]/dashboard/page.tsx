import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DashboardPage({
  params,
}: {
  params: { locale: string }
}) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem' }}>
      <h1 style={{ color: 'var(--text)' }}>🍍 Dashboard</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Em construção. O feed de matches, mensagens e eventos vêm a seguir.
      </p>
      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <Link
          href={`/${params.locale}/verification`}
          style={{ display: 'block', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem', color: 'var(--text)', textDecoration: 'none' }}
        >
          ✅ Verificar perfil
        </Link>
        <Link
          href={`/${params.locale}/admin`}
          style={{ display: 'block', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem', color: 'var(--text)', textDecoration: 'none' }}
        >
          🔧 Admin
        </Link>
      </div>
      <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <Link href={`/${params.locale}/legal`} style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textDecoration: 'none' }}>
          Documentos Legais · © Amplia Solutions 2026
        </Link>
      </div>
    </div>
  )
}
