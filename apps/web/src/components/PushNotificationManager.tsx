'use client'

import { useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let index = 0; index < rawData.length; ++index) {
    outputArray[index] = rawData.charCodeAt(index)
  }
  return outputArray
}

export default function PushNotificationManager({ userId }: { userId: number }) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setPermission(Notification.permission)

    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js')
    }
  }, [])

  const subscribe = async () => {
    try {
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)
      if (permissionResult !== 'granted') return

      const registration = await navigator.serviceWorker.ready
      const applicationServerKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!applicationServerKey) return

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(applicationServerKey),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      setSubscribed(true)
    } catch (error) {
      console.error('Push subscription failed:', error)
    }
  }

  if (permission === 'granted' || subscribed) return null
  if (permission === 'denied') return null

  return (
    <div style={{
      position: 'fixed', bottom: '1rem', left: '50%', transform: 'translateX(-50%)',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '0.75rem', padding: '1rem 1.5rem',
      display: 'flex', alignItems: 'center', gap: '1rem',
      zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      maxWidth: '400px', width: 'calc(100% - 2rem)',
    }}>
      <span style={{ fontSize: '1.5rem' }}>🍍</span>
      <div style={{ flex: 1 }}>
        <p style={{ color: 'var(--text)', fontSize: '0.85rem', fontWeight: 600 }}>
          Activar notificações
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          Sabe quando tens novos matches e mensagens
        </p>
      </div>
      <button
        onClick={() => void subscribe()}
        className="btn-primary"
        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
      >
        Activar
      </button>
      <input type="hidden" value={String(userId)} readOnly />
    </div>
  )
}