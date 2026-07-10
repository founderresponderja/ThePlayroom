'use client'

import { useMemo, useState } from 'react'

type UserRow = {
  id: number
  clerkUserId: string
  displayName: string
  accountType: string
  adminRole: string
  verificationLevel: string
  onboardingComplete: boolean
  isVip: boolean
  createdAt: string
  deletedAt?: string | null
}

const ROLE_OPTIONS = [
  { value: 'none', label: 'Sem privilégios' },
  { value: 'admin', label: 'Administrador' },
  { value: 'super_admin', label: 'Super Admin' },
] as const

export default function UsersAdminTable({
  initialUsers,
  canManageRoles,
  currentAdminRole,
}: {
  initialUsers: UserRow[]
  canManageRoles: boolean
  currentAdminRole: 'none' | 'admin' | 'super_admin'
}) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'vip' | 'free' | 'club' | 'shop' | 'single'>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [suspendingId, setSuspendingId] = useState<number | null>(null)
  const [roleUpdatingId, setRoleUpdatingId] = useState<number | null>(null)
  const [error, setError] = useState('')

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
    setError('')
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suspend', deletedAt: new Date().toISOString() }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to suspend user')
      setUsers((prev) => prev.map((user) => user.id === userId ? { ...user, deletedAt: new Date().toISOString() } : user))
    } catch (suspendError) {
      setError(suspendError instanceof Error ? suspendError.message : 'Erro inesperado')
    } finally {
      setSuspendingId(null)
    }
  }

  const handleRoleChange = async (userId: number, adminRole: 'none' | 'admin' | 'super_admin') => {
    setRoleUpdatingId(userId)
    setError('')
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setRole', adminRole }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Falha ao atualizar privilégios')
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, adminRole } : user)))
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : 'Erro inesperado')
    } finally {
      setRoleUpdatingId(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {error && (
        <div style={{ background: '#450a0a', color: '#fecaca', border: '1px solid #7f1d1d', borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
          {error}
        </div>
      )}

      {canManageRoles && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
          Sessão atual: <strong style={{ color: 'var(--text)' }}>{currentAdminRole}</strong>. Apenas super admin pode alterar privilégios de admin/super admin.
        </div>
      )}

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
              <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Permissão</th>
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
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '999px',
                      background: user.adminRole === 'super_admin' ? '#7c3aed' : user.adminRole === 'admin' ? '#0369a1' : 'var(--surface-2)',
                      color: user.adminRole === 'none' ? 'var(--text-muted)' : '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      {user.adminRole}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{user.isVip ? 'Sim' : 'Não'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button onClick={() => setExpandedId(expandedId === user.id ? null : user.id)} style={{ padding: '0.45rem 0.7rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>
                        Ver detalhes
                      </button>
                      <button onClick={() => handleSuspend(user.id)} disabled={suspendingId === user.id || !!user.deletedAt} style={{ padding: '0.45rem 0.7rem', border: 'none', borderRadius: '0.5rem', background: 'var(--primary)', color: 'white', cursor: 'pointer' }}>
                        {user.deletedAt ? 'Suspenso' : 'Suspender'}
                      </button>
                      {canManageRoles && (
                        <select
                          value={(user.adminRole || 'none') as 'none' | 'admin' | 'super_admin'}
                          onChange={(event) => void handleRoleChange(user.id, event.target.value as 'none' | 'admin' | 'super_admin')}
                          disabled={roleUpdatingId === user.id}
                          style={{
                            padding: '0.45rem 0.55rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border)',
                            background: 'var(--surface)',
                            color: 'var(--text)',
                            cursor: 'pointer',
                          }}
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedId === user.id && (
                  <tr>
                    <td colSpan={5} style={{ padding: '0.75rem 0.75rem 1rem', color: 'var(--text-muted)', background: 'var(--surface-2)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                        <div><strong style={{ color: 'var(--text)' }}>clerkUserId:</strong> {user.clerkUserId}</div>
                        <div><strong style={{ color: 'var(--text)' }}>adminRole:</strong> {user.adminRole ?? 'none'}</div>
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
