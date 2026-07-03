import { useAuth } from '@clerk/expo'
import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, SafeAreaView, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { apiFetch } from '../../src/lib/api'
import { colors, spacing, radius } from '../../src/constants/theme'

type Match = {
  matchId: string
  user: {
    id: number
    displayName: string | null
    primaryPhoto: string | null
  }
}

export default function MatchesScreen() {
  const { getToken } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  const loadMatches = useCallback(async () => {
    try {
      const token = await getToken()
      const data = await apiFetch<Match[]>('/api/matches', token)
      setMatches(data)
    } catch {
      // ignore matches errors for MVP
    }
    setLoading(false)
  }, [getToken])

  useEffect(() => {
    void loadMatches()
  }, [loadMatches])

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Matches</Text>
      </View>

      {matches.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🍍</Text>
          <Text style={styles.empty}>Ainda não tens matches.</Text>
          <Text style={[styles.empty, { fontSize: 14 }]}>Vai ao feed e dá likes!</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.matchId}
          contentContainerStyle={{ padding: spacing.md }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.matchCard}
              onPress={() => router.push(`/messages/${item.user.id}`)}
            >
              {item.user.primaryPhoto ? (
                <Image source={{ uri: item.user.primaryPhoto }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={{ fontSize: 24 }}>🍍</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.matchName}>{item.user.displayName ?? 'Anónimo'}</Text>
                <Text style={styles.matchSub}>🔒 Mensagem encriptada</Text>
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 20 }}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  header: { padding: spacing.md },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  empty: { color: colors.textMuted, fontSize: 16, textAlign: 'center', marginBottom: spacing.xs },
  matchCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: spacing.md },
  avatarPlaceholder: { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  matchName: { color: colors.text, fontWeight: '600', fontSize: 15 },
  matchSub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
})
