import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, users, photos, profiles, eq } from '@playroom/db'
import ProfileEditor from './ProfileEditor'

export default async function ProfileEditPage({ params }: { params: { locale: string } }) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  const user = await db.query.users.findFirst({ where: eq(users.clerkUserId, userId) })
  if (!user) redirect(`/${params.locale}/sign-in`)

  const userPhotos = await db.query.photos.findMany({
    where: eq(photos.userId, user.id),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  })

  // Fixed: was erroneously using photos.userId — must use profiles.userId
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
  })

  return <ProfileEditor user={user} photos={userPhotos} profile={profile ?? null} />
}
