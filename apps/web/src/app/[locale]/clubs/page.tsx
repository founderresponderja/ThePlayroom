import { db, clubs, eq } from '@playroom/db'
import ClubsList from './ClubsList'

export default async function ClubsPage({ params }: { params: { locale: string } }) {
  const allClubs = await db.query.clubs.findMany({
    where: eq(clubs.verified, true),
    orderBy: (c, { asc }) => [asc(c.name)],
  })

  // clubs stores coordinates in jsonb 'location' (no separate lat/lng columns)
  // Extract and fuzz to 1 decimal place before passing to client
  const fuzzedClubs = allClubs.map(club => {
    const loc = club.location as { lat?: number; lng?: number } | null
    return {
      id:          club.id,
      name:        club.name,
      description: club.description,
      address:     club.address,
      lat:         loc?.lat != null ? Math.round(loc.lat * 10) / 10 : null,
      lng:         loc?.lng != null ? Math.round(loc.lng * 10) / 10 : null,
      // amenities is jsonb (unknown) — cast to string[] for the client component
      amenities:   club.amenities as string[] | null,
      verified:    club.verified,
    }
  })

  return <ClubsList clubs={fuzzedClubs} locale={params.locale} />
}
