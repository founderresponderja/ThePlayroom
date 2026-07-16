import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { scanImageForCSAM } from './csam'

describe('scanImageForCSAM', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('CSAM scanner not configured', () => {
    it('should BLOCK uploads in production without API key (fail-closed)', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('CSAM_SCANNER_API_KEY', '')

      const imageBuffer = new ArrayBuffer(1024)
      const result = await scanImageForCSAM(imageBuffer, 'test.jpg')

      expect(result.safe).toBe(false)
      expect(result.scanned).toBe(false)
      expect(result.reason).toContain('not configured')
    })

    it('should ALLOW uploads in development without API key, but mark as unscanned', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      vi.stubEnv('CSAM_SCANNER_API_KEY', '')

      const imageBuffer = new ArrayBuffer(1024)
      const result = await scanImageForCSAM(imageBuffer, 'test.jpg')

      expect(result.safe).toBe(true)
      expect(result.scanned).toBe(false)
      expect(result.reason).toContain('not configured')
    })

    it('should ALLOW uploads in test environment without API key, but mark as unscanned', async () => {
      vi.stubEnv('NODE_ENV', 'test')
      vi.stubEnv('CSAM_SCANNER_API_KEY', '')

      const imageBuffer = new ArrayBuffer(1024)
      const result = await scanImageForCSAM(imageBuffer, 'test.jpg')

      expect(result.safe).toBe(true)
      expect(result.scanned).toBe(false)
    })
  })

  describe('CSAM scanner configured (placeholder)', () => {
    beforeEach(() => {
      vi.stubEnv('CSAM_SCANNER_API_KEY', 'test-api-key-12345')
    })

    it('should return safe: true but scanned: false for placeholder scanner', async () => {
      // Placeholder scanner always returns safe: true, scanned: false
      const imageBuffer = new ArrayBuffer(1024)
      const result = await scanImageForCSAM(imageBuffer, 'test.jpg')

      expect(result.safe).toBe(true)
      expect(result.scanned).toBe(false)
      expect(result.reason).toContain('Placeholder')
    })

    it('should handle scanner errors gracefully (fail-safe)', async () => {
      // This would test real scanner error handling
      // For now, the placeholder doesn't throw, but real implementations should
      const imageBuffer = new ArrayBuffer(0)
      const result = await scanImageForCSAM(imageBuffer, 'test.jpg')

      // Placeholder succeeds, but real scanner might fail
      expect(result).toHaveProperty('safe')
      expect(result).toHaveProperty('scanned')
    })
  })

  describe('CSAM scanner result interpretation', () => {
    beforeEach(() => {
      vi.stubEnv('CSAM_SCANNER_API_KEY', 'test-api-key-12345')
    })

    it('scanned field should only be true for real scanners', async () => {
      const imageBuffer = new ArrayBuffer(1024)
      const result = await scanImageForCSAM(imageBuffer, 'test.jpg')

      // With placeholder, scanned must always be false
      expect(result.scanned).toBe(false)
    })

    it('safe field should be independent of scanned field', async () => {
      const imageBuffer = new ArrayBuffer(1024)
      const result = await scanImageForCSAM(imageBuffer, 'test.jpg')

      // Can be safe but unscanned (placeholder case)
      expect(result.safe).toBe(true)
      expect(result.scanned).toBe(false)
    })
  })
})
