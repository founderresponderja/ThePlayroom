import * as Sentry from '@sentry/nextjs'

type SafeSearchResult = {
  flagged: boolean
  categories: Record<string, string>
  reason: string
}

const SAFESEARCH_FLAG_VALUES = new Set(['LIKELY', 'VERY_LIKELY'])

export async function runSafeSearchHeuristic(imageBytes: Buffer): Promise<SafeSearchResult> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY

  if (!apiKey) {
    return {
      flagged: false,
      categories: {},
      reason: 'not_configured',
    }
  }

  try {
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: Buffer.from(imageBytes).toString('base64'),
            },
            features: [{ type: 'SAFE_SEARCH_DETECTION' }],
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error('[safesearch] Vision API returned non-OK status', {
        status: response.status,
      })
      Sentry.withScope((scope) => {
        scope.setLevel('warning')
        scope.setTag('service', 'google_vision')
        scope.setTag('operation', 'safe_search_detection')
        scope.setExtra('http_status', response.status)
        Sentry.captureMessage('[safesearch] Vision API returned non-OK status')
      })
      return {
        flagged: false,
        categories: {},
        reason: 'error',
      }
    }

    const data = (await response.json()) as {
      responses?: Array<{
        safeSearchAnnotation?: Record<string, string>
      }>
    }

    const annotation = data.responses?.[0]?.safeSearchAnnotation ?? {}
    const adult = annotation.adult ?? 'UNKNOWN'
    const violence = annotation.violence ?? 'UNKNOWN'
    const racy = annotation.racy ?? 'UNKNOWN'
    const medical = annotation.medical ?? 'UNKNOWN'
    const spoof = annotation.spoof ?? 'UNKNOWN'

    const categories: Record<string, string> = {
      adult,
      violence,
      racy,
      medical,
      spoof,
    }

    const flagged =
      SAFESEARCH_FLAG_VALUES.has(adult) ||
      SAFESEARCH_FLAG_VALUES.has(violence) ||
      SAFESEARCH_FLAG_VALUES.has(racy)

    return {
      flagged,
      categories,
      reason: flagged ? 'flagged' : 'ok',
    }
  } catch (error) {
    console.error('[safesearch] Heuristic call failed', error)
    Sentry.withScope((scope) => {
      scope.setLevel('warning')
      scope.setTag('service', 'google_vision')
      scope.setTag('operation', 'safe_search_detection')
      Sentry.captureException(error)
    })
    return {
      flagged: false,
      categories: {},
      reason: 'error',
    }
  }
}
