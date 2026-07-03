import { useAuth } from '@clerk/expo'
import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, SafeAreaView, ActivityIndicator,
} from 'react-native'
import { apiFetch } from '../../src/lib/api'
import { colors, spacing, radius } from '../../src/constants/theme'

type UserProfile = {
  id: number
  displayName: string | null
  accountType: string | null
  verificationLevel: string | null
  isVip: boolean | null
  onboardingComplete: boolean | null
}

export default function ProfileScreen() {
  const { getToken, signOut } = useAuth()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    try {
      const token = await getToken()
      const userData = await apiFetch<UserProfile>('/api/users/me', token)
      setUser(userData)
    } catch {
      // ignore profile errors for MVP
    }
    setLoading(false)
  }, [getToken])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>👤 Perfil</Text>
          {user?.isVip && (
            <View style={styles.vipBadge}>
              <Text style={styles.vipText}>VIP</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.avatarPlaceholder}>
            <Text style={{ fontSize: 48 }}>🍍</Text>
          </View>
          <Text style={styles.name}>{user?.displayName ?? 'Sem nome'}</Text>
          <Text style={styles.accountType}>{user?.accountType ?? ''}</Text>
          {user?.verificationLevel && user.verificationLevel !== 'none' && (
            <Text style={styles.verified}>✅ Verificado</Text>
          )}
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionText}>✏️ Editar perfil</Text>
            <Text style={{ color: colors.textMuted }}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionText}>✅ Verificação</Text>
            <Text style={{ color: colors.textMuted }}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionText}>💎 Planos VIP</Text>
            <Text style={{ color: colors.textMuted }}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem}>
            <Text style={styles.actionText}>🍍 The Kink Test</Text>
            <Text style={{ color: colors.textMuted }}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => void signOut()}
        >
          <Text style={styles.signOutText}>Terminar sessão</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  vipBadge: { backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 2 },
  vipText: { color: 'white', fontSize: 11, fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  name: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: spacing.xs },
  accountType: { color: colors.textMuted, fontSize: 14 },
  verified: { color: '#4ade80', fontSize: 13, marginTop: spacing.xs },
  actionsSection: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, marginBottom: spacing.lg, overflow: 'hidden' },
  actionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  actionText: { color: colors.text, fontSize: 15 },
  signOutButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  signOutText: { color: '#f87171', fontSize: 15, fontWeight: '600' },
})
