import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, users, photos, profiles, quizResults, eq } from '@playroom/db'
import ProfileView from './ProfileView'

export default async function ProfilePage({ params }: { params: { locale: string } }) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  const user = await db.query.users.findFirst({ where: eq(users.clerkUserId, userId) })
  if (!user) redirect(`/${params.locale}/sign-in`)
  if (!user.onboardingComplete) redirect(`/${params.locale}/onboarding`)

  const userPhotos = await db.query.photos.findMany({
    where: eq(photos.userId, user.id),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  })

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
  })

  const latestQuiz = await db.query.quizResults.findFirst({
    where: eq(quizResults.userId, user.id),
    orderBy: (q, { desc }) => [desc(q.createdAt)], // createdAt now exists after schema update
  })

  // derivedTags is jsonb → unknown; cast safely to string[]
  const derivedTags = Array.isArray(latestQuiz?.derivedTags)
    ? (latestQuiz.derivedTags as string[])
    : []

  return (
    <ProfileView
      user={user}
      photos={userPhotos}
      profile={profile ?? null}
      archetype={latestQuiz?.archetype ?? null}
      derivedTags={derivedTags}
    />
  )
}
