export type ScanResult = {
  safe: boolean
  scanned: boolean // true only if a real scanner ran; false for placeholders or unavailable
  reason?: string
  hash?: string
}

// Placeholder CSAM scanner.
// Replace this with real PhotoDNA / NCMEC / Thorn API integration before public launch.
// CRITICAL: Fail-closed in production if no scanner configured.
export async function scanImageForCSAM(
  imageBuffer: ArrayBuffer,
  filename: string,
): Promise<ScanResult> {
  void imageBuffer
  void filename

  const apiKey = process.env.CSAM_SCANNER_API_KEY
  const isProduction = process.env.NODE_ENV === 'production'

  // FAIL-CLOSED: If no scanner API key in production, block the upload.
  // This is intentional — we MUST NOT accept uploads without real CSAM scanning.
  if (!apiKey) {
    if (isProduction) {
      console.error(
        '[CSAM] BLOCKING UPLOAD: CSAM scanner not configured in production. ' +
        'CSAM_SCANNER_API_KEY is not set. Uploads are not permitted without active scanning.',
      )
      return {
        safe: false,
        scanned: false,
        reason: 'CSAM scanner is not configured. Uploads are blocked for safety.',
      }
    }

    // In development/staging, allow uploads but mark as unscanned for transparency.
    console.warn(
      '[CSAM] WARNING: No scanner configured in non-production environment. ' +
      'Upload allowed, but marked as UNSCANNED. Do not deploy this to production.',
    )
    return {
      safe: true,
      scanned: false,
      reason: 'CSAM scanner not configured in development mode.',
    }
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
    // return { safe: !result.IsMatch, scanned: true, hash: result.TrackingId }

    // For now (placeholder): allow but mark as unscanned, never true.
    return {
      safe: true,
      scanned: false,
      reason: 'Placeholder scanner (no real CSAM detection active).',
    }
  } catch (error) {
    // Fail safe: block on scanner errors, never allow.
    console.error('[CSAM] Scanner error, blocking upload:', error)
    return {
      safe: false,
      scanned: false,
      reason: 'CSAM scanner encountered an error. Upload blocked for safety.',
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

  // Alert operations team via Make.com webhook (see ops-alerts.ts).
  try {
    const alertResult = await import('./ops-alerts').then((m) =>
      m.sendOpsAlert({
        type: 'csam_detected',
        severity: 'critical',
        payload: incident,
      }),
    )
    console.log('[CSAM] Operations alert sent:', alertResult)
  } catch (err) {
    console.error('[CSAM] Failed to send ops alert:', err)
    // Don't fail the upload rejection if alerting fails — safety first.
  }

  // TODO: Before public launch, integrate with:
  // 1. NCMEC CyberTipline API (US)
  // 2. IWF (Internet Watch Foundation) API (UK/EU)
  // 3. INHOPE member organisation for Portugal

  console.warn('[CSAM] External reporting integration disabled; incident kept in server logs only.')
}
