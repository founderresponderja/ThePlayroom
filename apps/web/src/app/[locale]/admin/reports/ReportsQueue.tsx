'use client'

import { useState } from 'react'

type ReportItem = {
  id: number
  reporterName: string
  targetName: string
  reason: string
  targetType: string
  createdAt: string
}

export default function ReportsQueue({ initialReports }: { initialReports: ReportItem[] }) {
  const [reports, setReports] = useState(initialReports)
  const [actioningId, setActioningId] = useState<number | null>(null)

  const handleResolve = async (reportId: number) => {
    setActioningId(reportId)
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed to resolve report')
      setReports((prev) => prev.filter((report) => report.id !== reportId))
    } finally {
      setActioningId(null)
    }
  }

  const handleBan = async (reportId: number) => {
    setActioningId(reportId)
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/ban`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to ban user')
      setReports((prev) => prev.filter((report) => report.id !== reportId))
    } finally {
      setActioningId(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {reports.map((report) => (
        <div key={report.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '0.25rem' }}>{report.reason}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Reporter: {report.reporterName} • Target: {report.targetName} • Tipo: {report.targetType}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{report.createdAt?.slice(0, 10)}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => handleResolve(report.id)} disabled={actioningId === report.id} style={{ padding: '0.55rem 0.8rem', border: 'none', borderRadius: '0.5rem', background: 'var(--primary)', color: 'white', cursor: 'pointer' }}>
                ✅ Resolver
              </button>
              <button onClick={() => handleBan(report.id)} disabled={actioningId === report.id} style={{ padding: '0.55rem 0.8rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>
                🚫 Banir utilizador
              </button>
            </div>
          </div>
        </div>
      ))}
      {reports.length === 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem', color: 'var(--text-muted)' }}>
          Nenhum report aberto.
        </div>
      )}
    </div>
  )
}
