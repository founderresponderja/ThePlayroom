export type CompatibilityResult = {
  userId: number
  score: number
  sharedTags: string[]
  incompatible: boolean
}

export function calculateCompatibility(
  userATags: string[],
  userBTags: string[]
): CompatibilityResult {
  // Extract hard limits (tags starting with "no:")
  const userALimits = new Set(
    userATags.filter(t => t.startsWith('no:')).map(t => t.replace('no:', ''))
  )
  const userBLimits = new Set(
    userBTags.filter(t => t.startsWith('no:')).map(t => t.replace('no:', ''))
  )

  // Extract positive tags (exclude "no:" and "curious:" prefixes for hard check)
  const userAPositive = userATags.filter(t => !t.startsWith('no:'))
  const userBPositive = userBTags.filter(t => !t.startsWith('no:'))

  // Check incompatibility — A wants something B has as hard limit and vice versa
  const incompatible =
    userAPositive.some(tag => userBLimits.has(tag.replace('curious:', ''))) ||
    userBPositive.some(tag => userALimits.has(tag.replace('curious:', '')))

  if (incompatible) {
    return { userId: 0, score: 0, sharedTags: [], incompatible: true }
  }

  // Calculate shared positive tags
  const setA = new Set(userAPositive)
  const sharedTags = userBPositive.filter(tag => setA.has(tag))

  // Score: shared tags / union of all tags (Jaccard similarity)
  const unionSize = new Set([...userAPositive, ...userBPositive]).size
  const score = unionSize > 0 ? Math.round((sharedTags.length / unionSize) * 100) : 0

  return { userId: 0, score, sharedTags, incompatible: false }
}

export function rankCandidates(
  currentUserTags: string[],
  candidates: Array<{ id: number; tags: string[] }>
): Array<{ id: number; score: number; sharedTags: string[] }> {
  return candidates
    .map(candidate => {
      const result = calculateCompatibility(currentUserTags, candidate.tags)
      return {
        id: candidate.id,
        score: result.score,
        sharedTags: result.sharedTags,
        incompatible: result.incompatible,
      }
    })
    .filter(c => !c.incompatible && c.score > 0)
    .sort((a, b) => b.score - a.score)
}
