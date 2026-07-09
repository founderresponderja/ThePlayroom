'use client'

import { useRouter } from 'next/navigation'

export function BackButton() {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm text-[var(--text)] transition hover:border-[var(--primary)]"
    >
      <span aria-hidden="true">←</span>
      Voltar
    </button>
  )
}