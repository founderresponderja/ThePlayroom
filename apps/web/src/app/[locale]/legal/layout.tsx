export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        {children}
      </div>
    </div>
  )
}
