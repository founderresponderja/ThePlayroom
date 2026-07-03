import { db, pushSubscriptions, eq } from '@playroom/db'
import { sendPushNotification } from './webpush'
import type webpush from 'web-push'

export async function notifyUser(
  userId: number,
  payload: { title: string; body: string; url?: string },
) {
  const subs = await db.query.pushSubscriptions.findMany({
    where: eq(pushSubscriptions.userId, userId),
  })

  await Promise.all(
    subs.map((sub) =>
      sendPushNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        } as webpush.PushSubscription,
        { ...payload, icon: '/icons/pineapple-192.png' },
      ),
    ),
  )
}