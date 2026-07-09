import { useAuth } from '@clerk/expo'
import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, ScrollView, SafeAreaView, ActivityIndicator,
} from 'react-native'
import { apiFetch } from '../../src/lib/api'
import { colors, spacing, radius } from '../../src/constants/theme'

type UserProfile = {
  id: number
  clerkUserId?: string
  clerk_user_id?: string
  displayName: string | null
  display_name?: string | null
  accountType: string | null
  account_type?: string | null
  verificationLevel: string | null
  verification_level?: string | null
  isVip: boolean | null
  is_vip?: boolean | null
  onboardingComplete: boolean | null
  onboarding_complete?: boolean | null
  ageVerifiedAt?: string | null
  age_verified_at?: string | null
}

type NormalizedUserProfile = {
  id: number
  displayName: string | null
  accountType: string | null
  verificationLevel: string | null
  isVip: boolean | null
  onboardingComplete: boolean | null
  ageVerifiedAt: string | null
}

function normalizeUserProfile(user: UserProfile): NormalizedUserProfile {
  return {
    id: user.id,
    displayName: user.displayName ?? user.display_name ?? null,
    accountType: user.accountType ?? user.account_type ?? null,
    verificationLevel: user.verificationLevel ?? user.verification_level ?? null,
    isVip: user.isVip ?? user.is_vip ?? null,
    onboardingComplete: user.onboardingComplete ?? user.onboarding_complete ?? null,
    ageVerifiedAt: user.ageVerifiedAt ?? user.age_verified_at ?? null,
  }
}

export default function ProfileScreen() {
  const { getToken, signOut } = useAuth()
  const [user, setUser] = useState<NormalizedUserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [displayNameInput, setDisplayNameInput] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadProfile = useCallback(async () => {
    try {
      const token = await getToken()
      const userData = await apiFetch<UserProfile>('/api/users/me', token)
      const normalized = normalizeUserProfile(userData)
      setUser(normalized)
      setDisplayNameInput(normalized.displayName ?? '')
    } catch (error) {
      console.error('[mobile] failed to load profile', error)
      setError('Não foi possível carregar o perfil.')
    }
    setLoading(false)
  }, [getToken])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const handleDisplayNameSave = async () => {
    if (!user || saving) return
    const nextDisplayName = displayNameInput.trim()
    if (!nextDisplayName) {
      setError('Display name é obrigatório.')
      return
    }
    if (!user.accountType) {
      setError('Tipo de conta em falta. Conclui o onboarding.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const token = await getToken()
      const patched = await apiFetch<UserProfile>('/api/users/me', token, {
        method: 'PATCH',
        body: JSON.stringify({
          accountType: user.accountType,
          displayName: nextDisplayName,
          ageVerifiedAt: user.ageVerifiedAt ?? new Date().toISOString(),
          onboardingComplete: user.onboardingComplete ?? true,
        }),
      })

      const normalized = normalizeUserProfile(patched)
      setUser(normalized)
      setDisplayNameInput(normalized.displayName ?? '')
      setSuccess('Display name atualizado com sucesso.')
    } catch (saveError) {
      console.error('[mobile] failed to update profile', saveError)
      setError(saveError instanceof Error ? saveError.message : 'Erro ao atualizar perfil.')
    }

    setSaving(false)
  }

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
          <Text style={styles.formTitle}>Editar display name</Text>
          <TextInput
            style={styles.input}
            value={displayNameInput}
            onChangeText={setDisplayNameInput}
            placeholder="Novo display name"
            placeholderTextColor={colors.textMuted}
            maxLength={100}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
            onPress={() => void handleDisplayNameSave()}
            disabled={saving}
          >
            <Text style={styles.primaryButtonText}>{saving ? 'A guardar...' : 'Guardar display name'}</Text>
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
  actionsSection: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, marginBottom: spacing.lg, padding: spacing.md },
  formTitle: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 15,
  },
  error: { color: '#f87171', fontSize: 13, marginTop: spacing.sm },
  success: { color: '#4ade80', fontSize: 13, marginTop: spacing.sm },
  primaryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: 'white', fontWeight: '700', fontSize: 15 },
  signOutButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  signOutText: { color: '#f87171', fontSize: 15, fontWeight: '600' },
})
