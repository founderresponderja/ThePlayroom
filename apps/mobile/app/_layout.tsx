import { ClerkProvider, useAuth } from '@clerk/expo'
import * as SecureStore from 'expo-secure-store'
import { Slot, useRouter, useSegments } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { apiFetch } from '../src/lib/api'
import { usePushNotifications } from '../src/hooks/usePushNotifications'
import { colors } from '../src/constants/theme'

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key)
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value)
  },
}

function AuthGuard() {
  const { isLoaded, isSignedIn, getToken, userId } = useAuth()
  usePushNotifications({ isSignedIn: Boolean(isSignedIn), userId, getToken })
  const segments = useSegments()
  const router = useRouter()
  const [checkingOnboarding, setCheckingOnboarding] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      setNeedsOnboarding(null)
      setCheckingOnboarding(false)
      return
    }

    let cancelled = false

    const checkOnboarding = async () => {
      setCheckingOnboarding(true)
      try {
        const token = await getToken()
        const me = await apiFetch<{ onboardingComplete?: boolean | null; onboarding_complete?: boolean | null }>(
          '/api/users/me',
          token,
        )

        const onboardingComplete = me.onboardingComplete ?? me.onboarding_complete ?? false
        if (!cancelled) {
          setNeedsOnboarding(!onboardingComplete)
        }
      } catch (error) {
        console.error('[mobile] onboarding check failed', error)
        if (!cancelled) {
          setNeedsOnboarding(false)
        }
      }

      if (!cancelled) {
        setCheckingOnboarding(false)
      }
    }

    void checkOnboarding()

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, getToken, userId])

  useEffect(() => {
    if (!isLoaded) return

    const inAuthGroup = segments[0] === '(auth)'
    const currentPath = segments.join('/')
    const inOnboarding = inAuthGroup && currentPath.includes('onboarding')

    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in')
      return
    }

    if (!isSignedIn) {
      return
    }

    if (checkingOnboarding || needsOnboarding === null) {
      return
    }

    if (needsOnboarding && !inOnboarding) {
      router.replace('/(auth)/onboarding')
      return
    }

    if (!needsOnboarding && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [isLoaded, isSignedIn, segments, checkingOnboarding, needsOnboarding])

  if (isSignedIn && (checkingOnboarding || needsOnboarding === null)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return <Slot />
}

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <AuthGuard />
      </View>
    </ClerkProvider>
  )
}
