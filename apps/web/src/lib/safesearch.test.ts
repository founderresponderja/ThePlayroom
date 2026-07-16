import { afterEach, describe, expect, it, vi } from 'vitest'
import { runSafeSearchHeuristic } from './safesearch'

describe('runSafeSearchHeuristic', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('returns neutral result when API key is not configured', async () => {
    vi.stubEnv('GOOGLE_VISION_API_KEY', '')

    const result = await runSafeSearchHeuristic(Buffer.from('fake-image'))

    expect(result).toEqual({
      flagged: false,
      categories: {},
      reason: 'not_configured',
    })
  })

  it('flags likely adult/racy/violence content', async () => {
    vi.stubEnv('GOOGLE_VISION_API_KEY', 'test-key')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          responses: [
            {
              safeSearchAnnotation: {
                adult: 'VERY_LIKELY',
                violence: 'UNLIKELY',
                racy: 'POSSIBLE',
                medical: 'VERY_UNLIKELY',
                spoof: 'UNLIKELY',
              },
            },
          ],
        }),
      })
    )

    const result = await runSafeSearchHeuristic(Buffer.from('fake-image'))

    expect(result.flagged).toBe(true)
    expect(result.reason).toBe('flagged')
    expect(result.categories.adult).toBe('VERY_LIKELY')
  })
})
