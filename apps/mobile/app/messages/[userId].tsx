import { useAuth } from '@clerk/expo'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { apiFetch } from '../../src/lib/api'
import { colors, spacing, radius } from '../../src/constants/theme'

type Message = {
  id: number
  senderId: number
  encryptedPayload: string
  createdAt: string | null
  decryptedText?: string
}

export default function MessageThreadScreen() {
  const { userId: otherUserId } = useLocalSearchParams<{ userId: string }>()
  const { getToken } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [threadId, setThreadId] = useState<number | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const listRef = useRef<FlatList>(null)

  const init = useCallback(async () => {
    try {
      const token = await getToken()
      const me = await apiFetch<{ id: number }>('/api/users/me', token)
      setCurrentUserId(me.id)

      const thread = await apiFetch<{ id: number }>(
        '/api/threads',
        token,
        { method: 'POST', body: JSON.stringify({ otherUserId: Number(otherUserId) }) },
      )
      setThreadId(thread.id)

      const msgs = await apiFetch<Message[]>(`/api/messages?threadId=${thread.id}`, token)
      setMessages(msgs.map((message) => ({
        ...message,
        decryptedText: message.senderId === me.id ? '(mensagem enviada)' : '[encriptado]',
      })))
    } catch {
      // ignore init errors for MVP
    }
    setLoading(false)
  }, [getToken, otherUserId])

  useEffect(() => {
    void init()
  }, [init])

  const handleSend = async () => {
    if (!input.trim() || !threadId || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)
    try {
      const token = await getToken()
      const saved = await apiFetch<Message>(
        '/api/messages',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ threadId, encryptedPayload: text }),
        },
      )
      setMessages((prev) => [...prev, { ...saved, decryptedText: text }])
      listRef.current?.scrollToEnd({ animated: true })
    } catch {
      // ignore send errors for MVP
    }
    setSending(false)
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Mensagem</Text>
          <Text style={styles.headerSub}>🔒 Encriptada</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(message) => String(message.id)}
          contentContainerStyle={{ padding: spacing.md }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ fontSize: 32, marginBottom: spacing.sm }}>🍍</Text>
              <Text style={{ color: colors.textMuted, textAlign: 'center' }}>
                Início da conversa
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={{
                alignSelf: item.senderId === currentUserId ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                marginBottom: spacing.sm,
              }}
            >
              <View
                style={[
                  styles.bubble,
                  item.senderId === currentUserId ? styles.bubbleSent : styles.bubbleReceived,
                ]}
              >
                <Text
                  style={{
                    color: item.senderId === currentUserId ? 'white' : colors.text,
                    fontSize: 15,
                  }}
                >
                  {item.decryptedText}
                </Text>
              </View>
            </View>
          )}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Escreve uma mensagem..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || sending) && styles.sendDisabled]}
            onPress={() => void handleSend()}
            disabled={!input.trim() || sending}
          >
            <Text style={{ color: 'white', fontSize: 18 }}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  back: { color: colors.textMuted, fontSize: 22, paddingRight: spacing.md },
  headerTitle: { color: colors.text, fontWeight: '600', fontSize: 15 },
  headerSub: { color: colors.textMuted, fontSize: 12 },
  bubble: { padding: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.lg },
  bubbleSent: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleReceived: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  input: { flex: 1, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: 15, maxHeight: 100, marginRight: spacing.sm },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.5 },
})