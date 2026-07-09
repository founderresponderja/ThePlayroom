import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db, eq, photos, profiles, clubs, shops } from '@playroom/db'
import { getCurrentUserByClerkId } from '@/lib/current-user'
import ProfileCompletionModal from './ProfileCompletionModal'
import MatchesList from './MatchesList'

export default async function MatchesPage({ params }: { params: { locale: string } }) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  const user = await getCurrentUserByClerkId(userId)
  if (!user?.onboardingComplete) redirect(`/${params.locale}/onboarding`)

  const userPhotos = await db.query.photos.findMany({
    where: eq(photos.userId, user.id),
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  })

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, user.id),
  })

  const club = user.accountType === 'SWING_CLUB'
    ? await db.query.clubs.findFirst({ where: eq(clubs.ownerUserId, user.id) })
    : null

  const shop = user.accountType === 'SEX_SHOP'
    ? await db.query.shops.findFirst({ where: eq(shops.ownerUserId, user.id) })
    : null

  const hasBio = Boolean(profile?.bio?.trim())
  const hasPhoto = userPhotos.length > 0
  const isSpecialAccount = user.accountType === 'SWING_CLUB' || user.accountType === 'SEX_SHOP'
  const profileComplete = hasBio && hasPhoto && (!isSpecialAccount || (user.accountType === 'SWING_CLUB' ? Boolean(club) : Boolean(shop)))

  if (!profileComplete) {
    return (
      <ProfileCompletionModal
        locale={params.locale}
        user={{ id: user.id, displayName: user.displayName, accountType: user.accountType }}
        photos={userPhotos}
        profile={profile ?? null}
        club={club ?? null}
        shop={shop ?? null}
      />
    )
  }

  return <MatchesList locale={params.locale} />
}
