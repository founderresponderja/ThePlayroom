import { auth } from '@clerk/nextjs/server'

export async function isAdmin(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false

  const adminIds = (process.env.ADMIN_USER_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  return adminIds.includes(userId)
}
