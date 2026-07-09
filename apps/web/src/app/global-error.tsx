'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt">
      <body>
        <div style={{ padding: 24 }}>
          <h2>Erro fatal da aplicação.</h2>
          <p>Volta a carregar a página.</p>
          <button type="button" onClick={() => reset()}>
            Recarregar
          </button>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{error.message}</pre>
        </div>
      </body>
    </html>
  )
}