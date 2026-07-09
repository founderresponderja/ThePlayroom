import { useAuth } from '@clerk/expo'
import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { apiFetch } from '../../src/lib/api'
import { colors, spacing, radius } from '../../src/constants/theme'

type Event = {
  id: number
  title: string
  description: string | null
  startsAt: string
  capacity: number | null
  ticketed: boolean | null
  priceCents: number | null
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-PT', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function EventsScreen() {
  const { getToken } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  const loadEvents = useCallback(async () => {
    try {
      const token = await getToken()
      const data = await apiFetch<Event[]>('/api/events', token)
      setEvents(data)
    } catch (error) {
      console.error('[mobile] failed to load events', error)
    }
    setLoading(false)
  }, [getToken])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

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
        <Text style={styles.headerTitle}>📅 Eventos</Text>
      </View>

      {events.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🍍</Text>
          <Text style={styles.empty}>Sem eventos disponíveis.</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: spacing.md }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.eventCard}
              onPress={() => router.push(`/events/${item.id}`)}
            >
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventDate}>📅 {formatDate(item.startsAt)}</Text>
              {item.description && (
                <Text style={styles.eventDesc} numberOfLines={2}>{item.description}</Text>
              )}
              <View style={styles.eventTags}>
                {item.capacity && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>👥 {item.capacity}</Text>
                  </View>
                )}
                {item.ticketed && item.priceCents && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>🎟️ €{(item.priceCents / 100).toFixed(2)}</Text>
                  </View>
                )}
                <View style={styles.tag}>
                  <Text style={styles.tagText}>📍 Localização protegida</Text>
                </View>
              </View>
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
  empty: { color: colors.textMuted, fontSize: 16, textAlign: 'center' },
  eventCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  eventTitle: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 4 },
  eventDate: { color: colors.textMuted, fontSize: 13, marginBottom: 4 },
  eventDesc: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.sm },
  eventTags: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { backgroundColor: colors.surface2, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2, marginRight: spacing.xs, marginBottom: spacing.xs },
  tagText: { color: colors.textMuted, fontSize: 11 },
})
