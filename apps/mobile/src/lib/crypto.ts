import * as SecureStore from 'expo-secure-store'
import _sodium from 'libsodium-wrappers'

type Keypair = {
  publicKey: string
  privateKey: string
}

function pubKeyStoreKey(userId: string) {
  return `keypair:${userId}:pub`
}

function privKeyStoreKey(userId: string) {
  return `keypair:${userId}:priv`
}

export async function getSodium() {
  await _sodium.ready
  return _sodium
}

export async function generateKeypair(): Promise<Keypair> {
  const sodium = await getSodium()
  const keypair = sodium.crypto_box_keypair()
  return {
    publicKey: sodium.to_base64(keypair.publicKey),
    privateKey: sodium.to_base64(keypair.privateKey),
  }
}

export async function encryptMessage(
  message: string,
  recipientPublicKeyB64: string,
): Promise<string> {
  const sodium = await getSodium()
  const recipientPublicKey = sodium.from_base64(recipientPublicKeyB64)
  const messageBytes = sodium.from_string(message)
  const encrypted = sodium.crypto_box_seal(messageBytes, recipientPublicKey)
  return sodium.to_base64(encrypted)
}

export async function decryptMessage(
  encryptedB64: string,
  publicKeyB64: string,
  privateKeyB64: string,
): Promise<string | null> {
  try {
    const sodium = await getSodium()
    const encrypted = sodium.from_base64(encryptedB64)
    const publicKey = sodium.from_base64(publicKeyB64)
    const privateKey = sodium.from_base64(privateKeyB64)
    const decrypted = sodium.crypto_box_seal_open(encrypted, publicKey, privateKey)
    return sodium.to_string(decrypted)
  } catch {
    return null
  }
}

export async function storeKeypair(userId: string, publicKey: string, privateKey: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(pubKeyStoreKey(userId), publicKey),
    SecureStore.setItemAsync(privKeyStoreKey(userId), privateKey),
  ])
}

export async function loadKeypair(userId: string): Promise<Keypair | null> {
  const [publicKey, privateKey] = await Promise.all([
    SecureStore.getItemAsync(pubKeyStoreKey(userId)),
    SecureStore.getItemAsync(privKeyStoreKey(userId)),
  ])

  if (!publicKey || !privateKey) {
    return null
  }

  return { publicKey, privateKey }
}
