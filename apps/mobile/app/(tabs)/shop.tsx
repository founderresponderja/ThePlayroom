import { useAuth } from '@clerk/expo'
import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, SafeAreaView, ActivityIndicator, TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'
import { apiFetch } from '../../src/lib/api'
import { colors, spacing, radius } from '../../src/constants/theme'

type Product = {
  id: number
  title: string
  description: string | null
  priceCents: number
  category: string | null
  images: string[] | null
}

export default function ShopScreen() {
  const { getToken } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadProducts = useCallback(async () => {
    try {
      const token = await getToken()
      const data = await apiFetch<Product[]>('/api/products', token)
      setProducts(data)
    } catch (error) {
      console.error('[mobile] failed to load marketplace products', error)
    }
    setLoading(false)
  }, [getToken])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  const filtered = products.filter((product) =>
    search === '' ||
    product.title.toLowerCase().includes(search.toLowerCase()),
  )

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
        <Text style={styles.headerTitle}>🛍️ Marketplace</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.search}
          placeholder="Pesquisar produtos..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🛍️</Text>
          <Text style={styles.empty}>
            {products.length === 0 ? 'Marketplace em breve.' : 'Nenhum produto encontrado.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={{ padding: spacing.md }}
          columnWrapperStyle={{ gap: spacing.sm }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => router.push(`/shop/${item.id}`)}
            >
              <View style={styles.productImage}>
                {item.images && item.images.length > 0 ? (
                  <Image
                    source={{ uri: item.images[0] }}
                    style={styles.productImageInner}
                  />
                ) : (
                  <Text style={{ fontSize: 32 }}>🛍️</Text>
                )}
              </View>
              <View style={{ padding: spacing.sm }}>
                <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
                {item.category && (
                  <Text style={styles.productCategory}>{item.category}</Text>
                )}
                <Text style={styles.productPrice}>
                  €{(item.priceCents / 100).toFixed(2)}
                </Text>
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
  header: { padding: spacing.md, paddingBottom: 0 },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  searchContainer: { padding: spacing.md },
  search: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: 15 },
  empty: { color: colors.textMuted, fontSize: 16, textAlign: 'center' },
  productCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden' },
  productImage: { aspectRatio: 1, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  productImageInner: { width: '100%', height: '100%' },
  productTitle: { color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: 2 },
  productCategory: { color: colors.textMuted, fontSize: 11, marginBottom: 4 },
  productPrice: { color: colors.primary, fontSize: 14, fontWeight: '700' },
})
