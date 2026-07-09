import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { useEffect, useRef } from 'react'
import { apiFetch } from '../lib/api'

type UsePushNotificationsParams = {
  isSignedIn: boolean
  userId?: string | null
  getToken: () => Promise<string | null>
}

function isPermissionGranted(permission: Notifications.NotificationPermissionsStatus): boolean {
  const normalized = permission as unknown as {
    granted?: boolean
    status?: string
    ios?: {
      status?: number
    }
  }

  if (typeof normalized.granted === 'boolean') {
    return normalized.granted
  }

  if (typeof normalized.status === 'string') {
    return normalized.status === 'granted'
  }

  return normalized.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED
}

export function usePushNotifications({ isSignedIn, userId, getToken }: UsePushNotificationsParams) {
  const lastRegisteredUserRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isSignedIn) {
      lastRegisteredUserRef.current = null
      return
    }

    const registrationKey = userId ?? 'signed-in'
    if (lastRegisteredUserRef.current === registrationKey) {
      return
    }

    let cancelled = false

    const registerPushToken = async () => {
      try {
        const permission = await Notifications.getPermissionsAsync()
        let permissionGranted = isPermissionGranted(permission)

        if (!permissionGranted) {
          const requested = await Notifications.requestPermissionsAsync()
          permissionGranted = isPermissionGranted(requested)
        }

        if (!permissionGranted) {
          console.error('[mobile] push permissions not granted')
          return
        }

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId

        const expoPushToken = projectId
          ? (await Notifications.getExpoPushTokenAsync({ projectId })).data
          : (await Notifications.getExpoPushTokenAsync()).data

        const authToken = await getToken()
        if (!authToken) {
          console.error('[mobile] missing auth token while subscribing to push notifications')
          return
        }

        await apiFetch<{ success: boolean }>('/api/push/subscribe', authToken, {
          method: 'POST',
          body: JSON.stringify({
            token: expoPushToken,
            platform: 'expo',
          }),
        })

        if (!cancelled) {
          lastRegisteredUserRef.current = registrationKey
        }
      } catch (error) {
        console.error('[mobile] failed to register push notifications', error)
      }
    }

    void registerPushToken()

    return () => {
      cancelled = true
    }
  }, [isSignedIn, userId, getToken])
}