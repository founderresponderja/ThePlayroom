import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const headersList = headers()
  const relevant = {
    'x-next-intl-locale': headersList.get('x-next-intl-locale'),
    'x-pathname': headersList.get('x-pathname'),
    'x-forwarded-uri': headersList.get('x-forwarded-uri'),
    'x-url': headersList.get('x-url'),
    'x-invoke-path': headersList.get('x-invoke-path'),
  }
  return NextResponse.json(relevant)
}
