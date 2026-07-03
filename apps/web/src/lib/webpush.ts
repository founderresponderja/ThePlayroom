import webpush from 'web-push'

let vapidConfigured = false

function ensureVapidDetails() {
  if (vapidConfigured) return

  const subject = process.env.VAPID_SUBJECT
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY

  if (!subject || !publicKey || !privateKey) {
    throw new Error('Missing VAPID environment variables')
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  vapidConfigured = true
}

export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: {
    title: string
    body: string
    icon?: string
    url?: string
  },
) {
  try {
    ensureVapidDetails()
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return true
  } catch (error) {
    console.error('Push notification failed:', error)
    return false
  }
}

export { webpush }