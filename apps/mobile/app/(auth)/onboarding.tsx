import { useAuth } from '@clerk/expo'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native'
import { apiFetch } from '../../src/lib/api'
import { colors, spacing, radius } from '../../src/constants/theme'

type AccountType =
  | 'FEMALE_SINGLE'
  | 'MALE_SINGLE'
  | 'COUPLE_MF'
  | 'COUPLE_MM'
  | 'COUPLE_FF'
  | 'SWING_CLUB'
  | 'SEX_SHOP'

const accountOptions: Array<{ value: AccountType; label: string }> = [
  { value: 'FEMALE_SINGLE', label: '👩 Single Feminina' },
  { value: 'MALE_SINGLE', label: '👨 Single Masculino' },
  { value: 'COUPLE_MF', label: '👫 Casal MF' },
  { value: 'COUPLE_MM', label: '👬 Casal MM' },
  { value: 'COUPLE_FF', label: '👭 Casal FF' },
  { value: 'SWING_CLUB', label: '🏛️ Swing Club' },
  { value: 'SEX_SHOP', label: '🛍️ Sex Shop' },
]

function toIsoFromDateInput(value: string): string | null {
  const parsed = new Date(`${value}T12:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed.toISOString()
}

function isAdult(dateIso: string): boolean {
  const birthDate = new Date(dateIso)
  const now = new Date()
  const minDate = new Date(
    now.getUTCFullYear() - 18,
    now.getUTCMonth(),
    now.getUTCDate(),
  )
  return birthDate <= minDate
}

export default function OnboardingScreen() {
  const { getToken } = useAuth()
  const router = useRouter()

  const [accountType, setAccountType] = useState<AccountType | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [birthDateInput, setBirthDateInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = useMemo(
    () => Boolean(accountType && displayName.trim() && birthDateInput.trim()),
    [accountType, displayName, birthDateInput],
  )

  const handleSubmit = async () => {
    if (!canSubmit || loading || !accountType) return

    setError('')
    setLoading(true)

    try {
      const dateOfBirthIso = toIsoFromDateInput(birthDateInput.trim())
      if (!dateOfBirthIso) {
        setError('Data de nascimento inválida. Usa o formato YYYY-MM-DD.')
        setLoading(false)
        return
      }

      if (!isAdult(dateOfBirthIso)) {
        setError('É necessário ter pelo menos 18 anos para usar a app.')
        setLoading(false)
        return
      }

      const token = await getToken()
      await apiFetch('/api/users/me', token, {
        method: 'PATCH',
        body: JSON.stringify({
          accountType,
          displayName: displayName.trim(),
          dateOfBirth: dateOfBirthIso,
          ageVerifiedAt: new Date().toISOString(),
          onboardingComplete: true,
        }),
      })

      router.replace('/(tabs)')
    } catch (submitError) {
      console.error('[mobile] onboarding submit failed', submitError)
      setError(submitError instanceof Error ? submitError.message : 'Erro ao concluir onboarding')
    }

    setLoading(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>🍍 Onboarding</Text>
        <Text style={styles.subtitle}>Completa o teu perfil para começar</Text>

        <Text style={styles.label}>Tipo de conta</Text>
        <View style={styles.optionsWrap}>
          {accountOptions.map((option) => {
            const selected = option.value === accountType
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => setAccountType(option.value)}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <Text style={styles.label}>Display name</Text>
        <TextInput
          style={styles.input}
          placeholder="Como queres aparecer?"
          placeholderTextColor={colors.textMuted}
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={100}
        />

        <Text style={styles.label}>Data de nascimento (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="1990-12-31"
          placeholderTextColor={colors.textMuted}
          value={birthDateInput}
          onChangeText={setBirthDateInput}
          autoCapitalize="none"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, (!canSubmit || loading) && styles.buttonDisabled]}
          onPress={() => void handleSubmit()}
          disabled={!canSubmit || loading}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <Text style={styles.buttonText}>Concluir onboarding</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, padding: spacing.lg },
  title: { color: colors.text, fontSize: 28, fontWeight: '700', marginBottom: spacing.xs },
  subtitle: { color: colors.textMuted, fontSize: 15, marginBottom: spacing.lg },
  label: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 15,
  },
  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: { color: colors.textMuted, fontSize: 13 },
  optionTextSelected: { color: 'white', fontWeight: '600' },
  error: { color: '#f87171', fontSize: 13, marginTop: spacing.sm },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
})
