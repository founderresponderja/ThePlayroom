import { auth, getAuth, verifyToken } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

function getAuthorizedParties() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  const fixed = ['https://www.theplayroom.pt', 'https://theplayroom.pt']
  return [appUrl, ...fixed].filter((v): v is string => !!v)
}

export async function getValidClerkSession(req: NextRequest): Promise<{ userId: string | null }> {
  try {
    const requestAuth = getAuth(req)
    if (requestAuth.userId) {
      return { userId: requestAuth.userId }
    }
  } catch (error) {
    console.error('[auth] getAuth(req) failed, falling back to auth()', error)
  }

  try {
    const authResult = await auth()
    if (authResult.userId) {
      return { userId: authResult.userId }
    }
  } catch (error) {
    console.error('[auth] auth() failed, falling back to bearer token', error)
  }

  const authorization = req.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return { userId: null }
  }

  const token = authorization.slice('Bearer '.length).trim()
  if (!token) {
    return { userId: null }
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      authorizedParties: getAuthorizedParties(),
    })

    return { userId: typeof payload.sub === 'string' ? payload.sub : null }
  } catch (error) {
    console.error('[auth] Failed to verify bearer token', error)
    return { userId: null }
  }
}
