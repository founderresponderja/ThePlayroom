import _sodium from 'libsodium-wrappers'

export async function getSodium() {
  await _sodium.ready
  return _sodium
}

export async function generateKeypair() {
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

export function storeKeypair(userId: string, publicKey: string, privateKey: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(`keypair:${userId}:pub`, publicKey)
  localStorage.setItem(`keypair:${userId}:priv`, privateKey)
}

export function loadKeypair(userId: string): { publicKey: string; privateKey: string } | null {
  if (typeof window === 'undefined') return null
  const publicKey = localStorage.getItem(`keypair:${userId}:pub`)
  const privateKey = localStorage.getItem(`keypair:${userId}:priv`)
  if (!publicKey || !privateKey) return null
  return { publicKey, privateKey }
}
