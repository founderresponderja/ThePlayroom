import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({ publicKey: null })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { publicKey } = (await req.json()) as { publicKey: string }
  if (!publicKey) return NextResponse.json({ error: 'Missing publicKey' }, { status: 400 })

  return NextResponse.json({ success: true })
}
