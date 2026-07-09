import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY)

  return NextResponse.json({
    aiFeatures: {
      coupleProfileGeneration: true,
      compatibilityComputation: true,
      privateCoupleCompatibility: true,
    },
    providers: {
      openai: {
        configured: hasOpenAiKey,
      },
      localFree: {
        configured: true,
        tokenCost: 0,
      },
    },
    activeProvider: hasOpenAiKey ? 'openai' : 'local-free',
  })
}
