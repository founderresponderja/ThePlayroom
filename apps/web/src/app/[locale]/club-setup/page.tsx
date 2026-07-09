import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, clubs, eq, users } from '@playroom/db'
import ClubSetupClient from './ClubSetupClient'

export default async function ClubSetupPage({ params }: { params: { locale: string } }) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  const user = await db.query.users.findFirst({
    where: eq(users.clerkUserId, userId),
  })
  if (!user || user.accountType !== 'SWING_CLUB') {
    redirect(`/${params.locale}/dashboard`)
  }

  const existingClub = await db.query.clubs.findFirst({
    where: eq(clubs.ownerUserId, user.id),
  })

  return (
    <ClubSetupClient
      locale={params.locale}
      existingClub={
        existingClub
          ? {
              id: existingClub.id,
              name: existingClub.name,
              description: existingClub.description,
              address: existingClub.address,
            }
          : null
      }
    />
  )
}
