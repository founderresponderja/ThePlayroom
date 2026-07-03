import { useAuth } from '@clerk/expo'
import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, Dimensions, SafeAreaView,
} from 'react-native'
import { apiFetch } from '../../src/lib/api'
import { colors, spacing, radius } from '../../src/constants/theme'

const { height } = Dimensions.get('window')

type Candidate = {
  id: number
  displayName: string | null
  accountType: string | null
  primaryPhoto: string | null
  bio: string | null
  compatibilityScore: number | null
  isVip: boolean | null
}

const ACCOUNT_LABELS: Record<string, string> = {
  FEMALE_SINGLE: '👩 Single Feminina',
  MALE_SINGLE: '👨 Single Masculino',
  COUPLE_MF: '👫 Casal MF',
  COUPLE_MM: '👬 Casal MM',
  COUPLE_FF: '👭 Casal FF',
}

export default function FeedScreen() {
  const { getToken } = useAuth()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [mutualMatch, setMutualMatch] = useState<Candidate | null>(null)

  const loadFeed = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const data = await apiFetch<Candidate[]>('/api/feed', token)
      setCandidates(data)
      setIndex(0)
    } catch {
      // ignore feed errors for MVP
    }
    setLoading(false)
  }, [getToken])

  useEffect(() => {
    void loadFeed()
  }, [loadFeed])

  const handleAction = async (action: 'like' | 'pass') => {
    const candidate = candidates[index]
    if (!candidate || actionLoading) return
    setActionLoading(true)
    try {
      const token = await getToken()
      const data = await apiFetch<{ isMutualMatch: boolean }>(
        '/api/feed/action',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ targetUserId: candidate.id, action }),
        },
      )
      if (data.isMutualMatch) setMutualMatch(candidate)
    } catch {
      // ignore action errors for MVP
    }
    setIndex((i) => i + 1)
    setActionLoading(false)
  }

  if (mutualMatch) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🍍</Text>
        <Text style={[styles.title, { color: colors.primary }]}>É um match!</Text>
        <Text style={[styles.subtitle, { marginBottom: spacing.xl }]}>Tu e {mutualMatch.displayName} gostaram um do outro</Text>
        {mutualMatch.primaryPhoto && (
          <Image
            source={{ uri: mutualMatch.primaryPhoto }}
            style={styles.matchPhoto}
          />
        )}
        <TouchableOpacity
          style={[styles.button, { marginTop: spacing.xl }]}
          onPress={() => setMutualMatch(null)}
        >
          <Text style={styles.buttonText}>Continuar a explorar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    )
  }

  const current = candidates[index]

  if (!current) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🍍</Text>
        <Text style={styles.title}>Viste tudo por agora</Text>
        <TouchableOpacity style={[styles.button, { marginTop: spacing.lg }]} onPress={() => void loadFeed()}>
          <Text style={styles.buttonText}>Actualizar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🍍 Feed</Text>
        <Text style={styles.counter}>{index + 1}/{candidates.length}</Text>
      </View>

      <View style={styles.card}>
        {current.primaryPhoto ? (
          <Image source={{ uri: current.primaryPhoto }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={{ fontSize: 64 }}>🍍</Text>
          </View>
        )}

        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{current.displayName ?? 'Anónimo'}</Text>
            {current.compatibilityScore && current.compatibilityScore > 0 && (
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{current.compatibilityScore}%</Text>
              </View>
            )}
          </View>
          <Text style={styles.accountType}>
            {current.accountType ? ACCOUNT_LABELS[current.accountType] ?? '' : ''}
          </Text>
          {current.bio && (
            <Text style={styles.bio} numberOfLines={2}>{current.bio}</Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.passButton}
          onPress={() => void handleAction('pass')}
          disabled={actionLoading}
        >
          <Text style={{ fontSize: 28 }}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => void handleAction('like')}
          disabled={actionLoading}
        >
          <Text style={{ fontSize: 32 }}>🍍</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const CARD_HEIGHT = height * 0.62

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, paddingTop: spacing.sm },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  counter: { color: colors.textMuted, fontSize: 14 },
  card: { marginHorizontal: spacing.md, borderRadius: radius.lg, overflow: 'hidden', height: CARD_HEIGHT, backgroundColor: colors.surface },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  cardInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md, paddingTop: spacing.xl },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { color: 'white', fontSize: 22, fontWeight: '700', marginRight: spacing.sm },
  scoreBadge: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  scoreText: { color: 'white', fontSize: 12, fontWeight: '700' },
  accountType: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 },
  bio: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: spacing.lg },
  passButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: spacing.xl },
  likeButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { fontSize: 16, color: colors.textMuted, textAlign: 'center' },
  matchPhoto: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: colors.primary },
  button: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
})
