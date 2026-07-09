export type ScanResult = {
  safe: boolean
  reason?: string
  hash?: string
}

// Placeholder CSAM scanner.
// Replace this with real PhotoDNA / NCMEC / Thorn API integration before public launch.
export async function scanImageForCSAM(
  imageBuffer: ArrayBuffer,
  filename: string,
): Promise<ScanResult> {
  void imageBuffer
  void filename

  const apiKey = process.env.CSAM_SCANNER_API_KEY

  // If no scanner configured, allow uploads in production but log the bypass.
  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[CSAM] No scanner configured in production. Bypassing scan and allowing upload temporarily.')
      return { safe: true, reason: 'CSAM scanner bypassed: no API key configured.' }
    }

    // In development, allow uploads but log warning.
    console.warn('[CSAM] WARNING: No scanner configured. Upload allowed in dev mode only.')
    return { safe: true }
  }

  try {
    // TODO: Replace with real API call.
    // Example PhotoDNA integration:
    // const response = await fetch('https://api.microsoftmoderator.com/photodna/v1.0/Match', {
    //   method: 'POST',
    //   headers: {
    //     'Ocp-Apim-Subscription-Key': apiKey,
    //     'Content-Type': 'image/jpeg',
    //   },
    //   body: imageBuffer,
    // })
    // const result = await response.json()
    // return { safe: !result.IsMatch, hash: result.TrackingId }

    return { safe: true }
  } catch (error) {
    // Fail safe: block on scanner errors.
    console.error('[CSAM] Scanner error, blocking upload:', error)
    return {
      safe: false,
      reason: 'Scanner error. Upload blocked for safety.',
    }
  }
}

export async function reportCSAM(
  imageKey: string,
  uploaderUserId: string,
  reason: string,
): Promise<void> {
  const timestamp = new Date().toISOString()
  const incident = {
    type: 'CSAM_DETECTED',
    userId: uploaderUserId,
    photoKey: imageKey,
    timestamp,
    reason,
  }

  console.error('[CSAM REPORT]', {
    ...incident,
    reportEndpoint: 'DISABLED',
  })

  // TODO: Before public launch, integrate with:
  // 1. NCMEC CyberTipline API (US)
  // 2. IWF (Internet Watch Foundation) API (UK/EU)
  // 3. INHOPE member organisation for Portugal

  console.warn('[CSAM] External ops webhook integration disabled; incident kept in server logs only.')
}
