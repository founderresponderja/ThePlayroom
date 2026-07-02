'use client'

import { useMemo, useState } from 'react'

type UserRow = {
  id: number
  clerkUserId: string
  displayName: string
  accountType: string
  verificationLevel: string
  onboardingComplete: boolean
  isVip: boolean
  createdAt: string
  deletedAt?: string | null
}

export default function UsersAdminTable({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'vip' | 'free' | 'club' | 'shop' | 'single'>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [suspendingId, setSuspendingId] = useState<number | null>(null)

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = user.displayName?.toLowerCase().includes(search.toLowerCase())
      const matchesFilter = filter === 'all'
        ? true
        : filter === 'vip'
          ? user.isVip
          : filter === 'free'
            ? !user.isVip
            : filter === 'club'
              ? user.accountType === 'SWING_CLUB'
              : filter === 'shop'
                ? user.accountType === 'SEX_SHOP'
                : ['FEMALE_SINGLE', 'MALE_SINGLE'].includes(user.accountType)
      return matchesSearch && matchesFilter
    })
  }, [filter, search, users])

  const handleSuspend = async (userId: number) => {
    setSuspendingId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletedAt: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error('Failed to suspend user')
      setUsers((prev) => prev.map((user) => user.id === userId ? { ...user, deletedAt: new Date().toISOString() } : user))
    } finally {
      setSuspendingId(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Procurar nome"
          style={{ flex: 1, minWidth: '220px', padding: '0.65rem 0.8rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
        />
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {['all', 'vip', 'free', 'club', 'shop', 'single'].map((option) => (
            <button key={option} onClick={() => setFilter(option as any)} style={{ padding: '0.55rem 0.75rem', borderRadius: '999px', border: '1px solid var(--border)', background: filter === option ? 'var(--primary)' : 'var(--surface)', color: filter === option ? 'white' : 'var(--text)', cursor: 'pointer' }}>
              {option === 'all' ? 'All' : option === 'vip' ? 'VIP' : option === 'free' ? 'Free' : option === 'club' ? 'Clubs' : option === 'shop' ? 'Shops' : 'Singles'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Nome</th>
              <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Tipo</th>
              <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>VIP</th>
              <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <>
                <tr key={user.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem', color: 'var(--text)' }}>{user.displayName}</td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{user.accountType}</td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{user.isVip ? 'Sim' : 'Não'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button onClick={() => setExpandedId(expandedId === user.id ? null : user.id)} style={{ padding: '0.45rem 0.7rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>
                        Ver detalhes
                      </button>
                      <button onClick={() => handleSuspend(user.id)} disabled={suspendingId === user.id || !!user.deletedAt} style={{ padding: '0.45rem 0.7rem', border: 'none', borderRadius: '0.5rem', background: 'var(--primary)', color: 'white', cursor: 'pointer' }}>
                        {user.deletedAt ? 'Suspenso' : 'Suspender'}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === user.id && (
                  <tr>
                    <td colSpan={4} style={{ padding: '0.75rem 0.75rem 1rem', color: 'var(--text-muted)', background: 'var(--surface-2)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                        <div><strong style={{ color: 'var(--text)' }}>clerkUserId:</strong> {user.clerkUserId}</div>
                        <div><strong style={{ color: 'var(--text)' }}>verificationLevel:</strong> {user.verificationLevel}</div>
                        <div><strong style={{ color: 'var(--text)' }}>onboardingComplete:</strong> {user.onboardingComplete ? 'Sim' : 'Não'}</div>
                        <div><strong style={{ color: 'var(--text)' }}>createdAt:</strong> {user.createdAt?.slice(0, 10)}</div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
