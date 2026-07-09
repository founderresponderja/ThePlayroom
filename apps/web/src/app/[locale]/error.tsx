'use client'

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ padding: 24 }}>
      <h2>Ocorreu um erro inesperado.</h2>
      <p>Tenta novamente.</p>
      <button onClick={() => reset()}>Recarregar</button>
    </div>
  )
}