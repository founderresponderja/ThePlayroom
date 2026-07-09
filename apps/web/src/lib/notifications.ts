import { db, pushSubscriptions, eq } from '@playroom/db'
import { sendPushNotification } from './webpush'
import type webpush from 'web-push'

type NotifyPayload = {
  title: string
  body: string
  url?: string
}

type ExpoMessage = {
  to: string
  title: string
  body: string
  sound: 'default'
  data?: {
    url?: string
  }
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const EXPO_TOKEN_REGEX = /^ExponentPushToken\[[^\]]+\]$/

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

async function sendExpoPushNotifications(tokens: string[], payload: NotifyPayload) {
  if (!tokens.length) return

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  const expoAccessToken = process.env.EXPO_ACCESS_TOKEN
  if (expoAccessToken) {
    headers.Authorization = `Bearer ${expoAccessToken}`
  }

  const messages: ExpoMessage[] = tokens.map((token) => ({
    to: token,
    title: payload.title,
    body: payload.body,
    sound: 'default',
    data: payload.url ? { url: payload.url } : undefined,
  }))

  const messageBatches = chunkArray(messages, 100)

  await Promise.all(
    messageBatches.map(async (batch) => {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(batch),
      })

      if (!response.ok) {
        const body = await response.text()
        console.error('Expo push request failed', { status: response.status, body })
        return
      }

      const parsed = await response.json() as {
        data?: Array<{ status: string; details?: unknown }>
        errors?: unknown
      }

      if (Array.isArray(parsed.data)) {
        parsed.data.forEach((ticket) => {
          if (ticket.status !== 'ok') {
            console.error('Expo push ticket error', ticket)
          }
        })
      }

      if (parsed.errors) {
        console.error('Expo push response errors', parsed.errors)
      }
    }),
  )
}

export async function notifyUser(
  userId: number,
  payload: NotifyPayload,
) {
  const subs = await db.query.pushSubscriptions.findMany({
    where: eq(pushSubscriptions.userId, userId),
  })

  const webSubs = subs.filter((sub) => sub.platform === 'web' && sub.p256dh && sub.auth)
  const expoTokens = subs
    .filter((sub) => sub.platform === 'expo' && EXPO_TOKEN_REGEX.test(sub.endpoint))
    .map((sub) => sub.endpoint)

  const webPromise = Promise.all(
    webSubs.map((sub) =>
      sendPushNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        } as webpush.PushSubscription,
        { ...payload, icon: '/icons/pineapple-192.png' },
      ),
    ),
  )

  const expoPromise = sendExpoPushNotifications(expoTokens, payload)

  await Promise.all([webPromise, expoPromise])
}