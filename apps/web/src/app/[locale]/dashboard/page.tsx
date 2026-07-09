import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'
import PushWrapper from './PushWrapper'

const accountTypeLabels: Record<string, string> = {
  FEMALE_SINGLE: '👩 Single Feminina',
  MALE_SINGLE: '👨 Single Masculino',
  COUPLE_MF: '👫 Casal MF',
  COUPLE_MM: '👬 Casal MM',
  COUPLE_FF: '👭 Casal FF',
  SWING_CLUB: '🏛️ Swing Club',
  SEX_SHOP: '🛍️ Sex Shop',
}

const verificationLabels: Record<string, string> = {
  none: 'Não verificado',
  photo: 'Verificação por foto',
  video: 'Verificação por vídeo',
  social: 'Verificação social',
}

const subscriptionTierLabels: Record<string, string> = {
  free: 'Free',
  vip: 'VIP',
}

export default async function DashboardPage({
  params,
}: {
  params: { locale: string }
}) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  const userResult = await (db as any).execute(sql`
    select
      id,
      account_type as "accountType",
      verification_level as "verificationLevel",
      subscription_tier as "subscriptionTier"
    from users
    where clerk_user_id = ${userId}
    limit 1
  `)
  const user = userResult?.[0] as
    | {
        id: number
        accountType: string
        verificationLevel: string | null
        subscriptionTier: string | null
      }
    | undefined

  if (!user) redirect(`/${params.locale}/onboarding`)

  const accountTypeLabel = accountTypeLabels[user.accountType] ?? user.accountType
  const verificationLabel = verificationLabels[user.verificationLevel ?? 'none'] ?? 'Não verificado'
  const subscriptionTierLabel = subscriptionTierLabels[user.subscriptionTier ?? 'free'] ?? (user.subscriptionTier ?? 'free')

  const isClub = user.accountType === 'SWING_CLUB'
  const isShop = user.accountType === 'SEX_SHOP'

  const navLinks = [
    { href: `/${params.locale}/profile`, label: '👤 O meu perfil' },
    ...(!isClub && !isShop ? [{ href: `/${params.locale}/matches`, label: '🔥 Matches' }] : []),
    ...(!isShop ? [{ href: `/${params.locale}/events`, label: '📅 Eventos' }] : []),
    ...(!isClub ? [{ href: `/${params.locale}/shop`, label: '🛍️ Marketplace' }] : []),
    { href: `/${params.locale}/verification`, label: '✅ Verificar perfil' },
  ]

  if (!isClub && !isShop) {
    navLinks.push({ href: `/${params.locale}/dashboard/orders`, label: '🧾 As Minhas Compras' })
  }

  if (isClub) {
    navLinks.push({ href: `/${params.locale}/club-setup`, label: '🏛️ Configurar clube' })
    navLinks.push({ href: `/${params.locale}/clubs`, label: '🏛️ Diretório de clubes' })
  }

  if (isShop) {
    navLinks.push({ href: `/${params.locale}/shop-setup`, label: '🛍️ Configurar loja' })
    navLinks.push({ href: `/${params.locale}/dashboard/shop/orders`, label: '📦 Encomendas da Loja' })
  }

  navLinks.push({ href: `/${params.locale}/pricing`, label: '💎 Planos e subscrição' })
  navLinks.push({ href: `/${params.locale}/admin`, label: '🔧 Configurações' })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem' }}>
      <h1 style={{ color: 'var(--text)' }}>🍍 Dashboard</h1>
      <p style={{ color: 'var(--text-muted)' }}>Resumo da tua conta e atalhos rápidos.</p>

      <div
        style={{
          marginTop: '1.25rem',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '1rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
        }}
      >
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Tipo de conta</p>
          <p style={{ color: 'var(--text)', fontWeight: 600 }}>{accountTypeLabel}</p>
        </div>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Verificação</p>
          <p style={{ color: 'var(--text)', fontWeight: 600 }}>{verificationLabel}</p>
        </div>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Subscrição</p>
          <p style={{ color: 'var(--text)', fontWeight: 600 }}>{subscriptionTierLabel}</p>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              display: 'block',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '1rem',
              color: 'var(--text)',
              textDecoration: 'none',
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <PushWrapper userId={user.id} />
      <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <Link href={`/${params.locale}/legal`} style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textDecoration: 'none' }}>
          Documentos Legais · © Amplia Solutions 2026
        </Link>
      </div>
    </div>
  )
}
