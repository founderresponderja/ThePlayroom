'use client'
import { useEffect, useState } from 'react'
import { generateKeypair, storeKeypair, loadKeypair } from '@/lib/crypto'

export function useKeypair(userId: string | null) {
  const [keypair, setKeypair] = useState<{ publicKey: string; privateKey: string } | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!userId) return

    const initKeypair = async () => {
      // Try loading from localStorage first
      const existing = loadKeypair(userId)
      if (existing) {
        setKeypair(existing)
        setReady(true)
        return
      }

      // Generate new keypair
      const newKeypair = await generateKeypair()
      storeKeypair(userId, newKeypair.publicKey, newKeypair.privateKey)
      setKeypair(newKeypair)

      // Register public key with server (only the public half)
      await fetch('/api/keypair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey: newKeypair.publicKey }),
      })

      setReady(true)
    }

    void initKeypair()
  }, [userId])

  return { keypair, ready }
}
