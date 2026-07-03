import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin'
import { db } from '@playroom/db'
import { sql } from 'drizzle-orm'

export async function GET() {
  const admin = await isAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [pending, clean, flagged] = await Promise.all([
    (db as any).execute(sql`select count(*)::int as count from photos where csam_scan_status = 'pending'`),
    (db as any).execute(sql`select count(*)::int as count from photos where csam_scan_status = 'clean'`),
    (db as any).execute(sql`select count(*)::int as count from photos where csam_scan_status = 'flagged'`),
  ])

  return NextResponse.json({
    pending: pending[0]?.count ?? 0,
    clean: clean[0]?.count ?? 0,
    flagged: flagged[0]?.count ?? 0,
    scannerConfigured: !!process.env.CSAM_SCANNER_API_KEY,
    note: 'Real CSAM scanning requires PhotoDNA/Thorn/NCMEC integration before public launch.',
  })
}
