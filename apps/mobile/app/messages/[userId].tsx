import { useAuth } from '@clerk/expo'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { apiFetch } from '../../src/lib/api'
import { colors, spacing, radius } from '../../src/constants/theme'
import {
  decryptMessage,
  encryptMessage,
  generateKeypair,
  loadKeypair,
  storeKeypair,
} from '../../src/lib/crypto'

type Message = {
  id: number
  senderId: number
  encryptedPayload: string
  createdAt: string | null
  decryptedText?: string
}

type CurrentUser = {
  id: number
  clerkUserId: string
}

type MatchApiItem = {
  user: {
    id: number
    publicKey: string | null
  }
}

type ThreadApiResponse = {
  id: number
}

type MobileKeypair = {
  publicKey: string
  privateKey: string
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
  const [keypair, setKeypair] = useState<MobileKeypair | null>(null)
  const [otherPublicKey, setOtherPublicKey] = useState<string | null>(null)
  const [error, setError] = useState('')
  const listRef = useRef<FlatList>(null)

  const init = useCallback(async () => {
    try {
      const token = await getToken()
      const me = await apiFetch<CurrentUser>('/api/users/me', token)
      setCurrentUserId(me.id)

      let currentKeypair = await loadKeypair(me.clerkUserId)
      if (!currentKeypair) {
        currentKeypair = await generateKeypair()
        await storeKeypair(me.clerkUserId, currentKeypair.publicKey, currentKeypair.privateKey)

        await apiFetch<{ success: boolean }>(
          '/api/keypair',
          token,
          {
            method: 'POST',
            body: JSON.stringify({ publicKey: currentKeypair.publicKey }),
          },
        )
      }

      setKeypair(currentKeypair)

      const matchList = await apiFetch<MatchApiItem[]>('/api/matches', token)
      const otherId = Number(otherUserId)
      const otherMatch = matchList.find((item) => item.user.id === otherId)
      const recipientPublicKey = otherMatch?.user.publicKey ?? null
      setOtherPublicKey(recipientPublicKey)

      const thread = await apiFetch<ThreadApiResponse>(
        '/api/threads',
        token,
        { method: 'POST', body: JSON.stringify({ otherUserId: Number(otherUserId) }) },
      )
      setThreadId(thread.id)

      const msgs = await apiFetch<Message[]>(`/api/messages?threadId=${thread.id}`, token)

      const decryptedMessages = await Promise.all(
        msgs.map(async (message) => {
          if (message.senderId === me.id) {
            return { ...message, decryptedText: '(mensagem enviada)' }
          }

          const decryptedText = await decryptMessage(
            message.encryptedPayload,
            currentKeypair.publicKey,
            currentKeypair.privateKey,
          )

          return {
            ...message,
            decryptedText: decryptedText ?? '(não foi possível desencriptar)',
          }
        }),
      )

      setMessages(decryptedMessages)
    } catch (error) {
      console.error('[mobile] failed to initialize message thread', error)
      setError('Erro ao carregar conversa encriptada.')
    }
    setLoading(false)
  }, [getToken, otherUserId])

  useEffect(() => {
    void init()
  }, [init])

  const handleSend = async () => {
    if (!input.trim() || !threadId || sending || !otherPublicKey || !keypair) return
    const text = input.trim()
    setInput('')
    setSending(true)
    setError('')
    try {
      const token = await getToken()
      const encryptedPayload = await encryptMessage(text, otherPublicKey)

      const saved = await apiFetch<Message>(
        '/api/messages',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ threadId, encryptedPayload }),
        },
      )
      setMessages((prev) => [...prev, { ...saved, decryptedText: text }])
      listRef.current?.scrollToEnd({ animated: true })
    } catch (error) {
      console.error('[mobile] failed to send message', error)
      setError('Erro ao enviar mensagem encriptada.')
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
        {error ? (
          <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>
            <Text style={{ color: '#f87171', fontSize: 13 }}>{error}</Text>
          </View>
        ) : null}

        {!otherPublicKey ? (
          <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>
              O destinatário ainda não configurou encriptação ponta-a-ponta.
            </Text>
          </View>
        ) : null}

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
            disabled={!input.trim() || sending || !otherPublicKey || !keypair}
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