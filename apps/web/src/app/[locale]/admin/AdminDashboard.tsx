'use client'
import { useRouter, useParams } from 'next/navigation'

type Metrics = {
  totalUsers: number
  newUsers30d: number
  vipUsers: number
  totalMatches: number
  totalMessages: number
  totalEvents: number
  totalReservations: number
  activeSubscriptions: number
  pendingReports: number
  totalAdmins: number
  totalSuperAdmins: number
  conversionRate: number
}

type UserByType = {
  accountType: string
  count: number
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  FEMALE_SINGLE: '👩 Single Feminina',
  MALE_SINGLE: '👨 Single Masculino',
  COUPLE_MF: '👫 Casal MF',
  COUPLE_MM: '👬 Casal MM',
  COUPLE_FF: '👭 Casal FF',
  SWING_CLUB: '🏛️ Swing Club',
  SEX_SHOP: '🛍️ Sex Shop',
  unknown: '❓ Desconhecido',
}

export default function AdminDashboard({
  metrics,
  usersByType,
}: {
  metrics: Metrics
  usersByType: UserByType[]
}) {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const metricCards = [
    { label: 'Total utilizadores', value: metrics.totalUsers, icon: '👥' },
    { label: 'Novos (30 dias)', value: metrics.newUsers30d, icon: '✨' },
    { label: 'Membros VIP', value: metrics.vipUsers, icon: '💎' },
    { label: 'Taxa de conversão', value: `${metrics.conversionRate}%`, icon: '📈' },
    { label: 'Matches mútuos', value: metrics.totalMatches, icon: '🍍' },
    { label: 'Mensagens', value: metrics.totalMessages, icon: '💬' },
    { label: 'Eventos', value: metrics.totalEvents, icon: '📅' },
    { label: 'Reservas', value: metrics.totalReservations, icon: '🎟️' },
    { label: 'Subscrições activas', value: metrics.activeSubscriptions, icon: '💳' },
    { label: 'Denúncias pendentes', value: metrics.pendingReports, icon: '🚨' },
    { label: 'Administradores', value: metrics.totalAdmins, icon: '🛡️' },
    { label: 'Super admins', value: metrics.totalSuperAdmins, icon: '👑' },
  ]

  const navItems = [
    { label: '📊 Métricas', href: `/${locale}/admin`, active: true },
    { label: '👥 Utilizadores', href: `/${locale}/admin/users` },
    { label: '🖼️ Moderação', href: `/${locale}/admin/moderation` },
    { label: '🚨 Reports', href: `/${locale}/admin/reports` },
    { label: '✅ Verificações', href: `/${locale}/admin/verifications` },
    { label: '⚙️ Sistema', href: `/${locale}/admin/system` },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: '1.1rem' }}>🍍 Admin</span>
          <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '999px' }}>The Playroom</span>
        </div>
        <button
          onClick={() => router.push(`/${locale}/dashboard`)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          ← App
        </button>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ width: '200px', background: 'var(--surface)', borderRight: '1px solid var(--border)', padding: '1rem', flexShrink: 0 }}>
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: item.active ? 'var(--surface-2)' : 'none',
                border: 'none', borderRadius: '0.5rem',
                padding: '0.625rem 0.75rem', marginBottom: '0.25rem',
                color: item.active ? 'var(--text)' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: '0.85rem',
                transition: 'background 0.15s',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          <h1 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            📊 Visão geral
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {metricCards.map((card) => (
              <div
                key={card.label}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '0.75rem', padding: '1.25rem',
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{card.icon}</div>
                <div style={{ color: 'var(--text)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  {card.value}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{card.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem' }}>
            <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
              Utilizadores por tipo de conta
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {usersByType.map((item) => (
                <div key={item.accountType} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text)', fontSize: '0.85rem' }}>
                    {ACCOUNT_TYPE_LABELS[item.accountType] ?? item.accountType}
                  </span>
                  <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
