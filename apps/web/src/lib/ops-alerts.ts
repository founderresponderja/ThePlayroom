/**
 * Ops Alerts: Send real-time alerts to operations team via Make.com webhook
 *
 * Used for critical events that require immediate human attention:
 * - CSAM detection (photos flagged by scanner)
 * - CSAM scanner unavailable (unscanned photos in production)
 * - Rate limit abuse
 * - System errors
 */

export type OpsAlertEvent = {
  type:
    | 'csam_detected'
    | 'csam_scanner_unavailable'
    | 'safesearch_flagged'
    | 'rate_limit_exceeded'
    | 'system_error'
  severity: 'critical' | 'warning'
  payload: Record<string, unknown>
}

export async function sendOpsAlert(event: OpsAlertEvent): Promise<{ sent: boolean; error?: string }> {
  const webhookUrl = process.env.MAKE_WEBHOOK_URL

  if (!webhookUrl) {
    // Make.com webhook not configured — log locally only
    console.warn('[ops-alert] MAKE_WEBHOOK_URL not configured. Alert will not be sent to operations team.', {
      eventType: event.type,
      severity: event.severity,
    })
    return { sent: false, error: 'MAKE_WEBHOOK_URL not configured' }
  }

  try {
    const timestamp = new Date().toISOString()
    const alertPayload = {
      timestamp,
      event_type: event.type,
      severity: event.severity,
      details: event.payload,
      environment: process.env.NODE_ENV,
    }

    console.info('[ops-alert] Sending alert to operations:', {
      eventType: event.type,
      severity: event.severity,
    })

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Webhook returned ${response.status}: ${errorText}`)
    }

    console.info('[ops-alert] Alert delivered successfully')
    return { sent: true }
  } catch (error) {
    console.error('[ops-alert] Failed to send alert:', error)
    // Don't re-throw — we want to fail gracefully if alerting fails,
    // but still allow the original operation to proceed.
    return {
      sent: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Alert when CSAM scanner is unavailable in production.
 * This helps operations track unscanned uploads and prioritize manual review.
 */
export async function alertScannerUnavailable(unscannedPhotoCount: number): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    return // Only alert in production
  }

  await sendOpsAlert({
    type: 'csam_scanner_unavailable',
    severity: 'warning',
    payload: {
      message: 'CSAM scanner is unavailable or not configured',
      unscanned_photo_count: unscannedPhotoCount,
      action_required: 'Manual review of unscanned photos required before they become public',
    },
  })
}
