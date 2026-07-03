'use client'

import dynamic from 'next/dynamic'

const PushNotificationManager = dynamic(
  () => import('@/components/PushNotificationManager'),
  { ssr: false },
)

export default function PushWrapper({ userId }: { userId: number }) {
  return <PushNotificationManager userId={userId} />
}