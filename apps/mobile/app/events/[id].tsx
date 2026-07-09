import { useAuth } from '@clerk/expo'
import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { apiFetch } from '../../src/lib/api'
import { colors, spacing, radius } from '../../src/constants/theme'

type Event = {
  id: number
  title: string
  description: string | null
  startsAt: string
  endsAt: string
  capacity: number | null
  ticketed: boolean | null
  priceCents: number | null
}

type Reservation = {
  id: number
  status: string
} | null

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { getToken } = useAuth()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [reservation, setReservation] = useState<Reservation>(null)
  const [loading, setLoading] = useState(true)
  const [reserving, setReserving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const token = await getToken()
      const eventData = await apiFetch<Event>(`/api/events/${id}`, token)
      setEvent(eventData)
    } catch (error) {
      console.error('[mobile] failed to load event detail', error)
      setError('Erro ao carregar evento')
    }
    setLoading(false)
  }, [getToken, id])

  useEffect(() => {
    void load()
  }, [load])

  const handleReserve = async () => {
    setReserving(true)
    setError('')
    try {
      const token = await getToken()
      const res = await apiFetch<{ id: number; status: string; error?: string }>(
        '/api/reservations',
        token,
        { method: 'POST', body: JSON.stringify({ eventId: Number(id) }) },
      )
      setReservation(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao reservar')
    }
    setReserving(false)
  }

  if (loading || !event) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    )
  }

  const statusLabels: Record<string, string> = {
    requested: '⏳ Aguarda aprovação',
    accepted: '✅ Aceite',
    declined: '❌ Recusado',
    waitlist: '⏳ Lista de espera',
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Evento</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.date}>
          📅 {new Date(event.startsAt).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
        </Text>

        {event.description && (
          <Text style={styles.description}>{event.description}</Text>
        )}

        <View style={styles.infoCard}>
          {event.capacity && (
            <Text style={styles.infoText}>👥 Capacidade: {event.capacity}</Text>
          )}
          {event.ticketed && event.priceCents && (
            <Text style={styles.infoText}>🎟️ €{(event.priceCents / 100).toFixed(2)}</Text>
          )}
          <Text style={styles.infoText}>📍 Localização revelada após reserva aceite</Text>
        </View>

        {reservation ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>
              {statusLabels[reservation.status] ?? reservation.status}
            </Text>
          </View>
        ) : (
          <>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity
              style={[styles.reserveButton, reserving && styles.buttonDisabled]}
              onPress={() => void handleReserve()}
              disabled={reserving}
            >
              <Text style={styles.reserveText}>
                {reserving ? 'A reservar...' : '🍍 Reservar lugar'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { color: colors.textMuted, fontSize: 22, marginRight: spacing.md },
  headerTitle: { color: colors.text, fontWeight: '600', fontSize: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: spacing.sm },
  date: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.md },
  description: { color: colors.text, fontSize: 15, lineHeight: 22, marginBottom: spacing.md },
  infoCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  infoText: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.xs },
  statusCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  statusText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  error: { color: colors.primary, fontSize: 14, textAlign: 'center', marginBottom: spacing.sm },
  reserveButton: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  reserveText: { color: 'white', fontSize: 16, fontWeight: '600' },
})