import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage({ params }: { params: { locale: string } }) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem' }}>
      <h1 style={{ color: 'var(--text)' }}>🍍 Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
        Em construção. O feed de matches, mensagens e eventos vêm a seguir.
      </p>
    </div>
  )
}
