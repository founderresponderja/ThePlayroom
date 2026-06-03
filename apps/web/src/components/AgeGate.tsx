'use client'
import { useEffect, useState } from 'react'

export function AgeGate() {
  const [verified, setVerified] = useState<boolean | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('age-verified')
    setVerified(saved === 'true')
  }, [])

  const confirm = () => {
    localStorage.setItem('age-verified', 'true')
    setVerified(true)
  }

  const deny = () => {
    window.location.href = 'https://www.google.com'
  }

  if (verified === null || verified) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4 py-8 text-white">
      <div className="w-full max-w-xl rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-2xl">
        <div className="mb-6 text-5xl">🍍</div>
        <h2 className="mb-4 text-3xl font-semibold">Tens 18 anos ou mais?</h2>
        <p className="mb-8 text-[var(--text-muted)]">The Playroom é uma plataforma exclusiva para adultos.</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button className="btn-primary w-full sm:w-auto" onClick={confirm}>
            Sim, tenho 18+
          </button>
          <button className="btn-outline w-full sm:w-auto" onClick={deny}>
            Não, sair
          </button>
        </div>
      </div>
    </div>
  )
}
