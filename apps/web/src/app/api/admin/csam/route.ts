import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin'
import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'
import { applyRateLimit } from '@/lib/rate-limit-middleware'

export async function GET() {
  const admin = await getAdminContext()
  if (!admin.isAdmin || !admin.appUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rateLimit = await applyRateLimit(admin.appUserId, 'ADMIN_ACTIONS')
  if (!rateLimit.allowed) {
    return rateLimit.response ?? NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const scannerConfigured = !!process.env.CSAM_SCANNER_API_KEY
  const bypassActive = process.env.NODE_ENV === 'production' && !scannerConfigured

  const [pending, clean, flagged] = await Promise.all([
    (db as any).execute(sql`select count(*)::int as count from photos where csam_scan_status = 'pending'`),
    (db as any).execute(sql`select count(*)::int as count from photos where csam_scan_status = 'clean'`),
    (db as any).execute(sql`select count(*)::int as count from photos where csam_scan_status = 'flagged'`),
  ])

  return NextResponse.json({
    pending: pending[0]?.count ?? 0,
    clean: clean[0]?.count ?? 0,
    flagged: flagged[0]?.count ?? 0,
    scannerConfigured,
    bypassActive,
    note: bypassActive
      ? 'Scanner CSAM em bypass temporário em produção. O upload continua a funcionar enquanto a API key nao estiver configurada.'
      : 'Real CSAM scanning requires PhotoDNA/Thorn/NCMEC integration before public launch.',
  })
}
