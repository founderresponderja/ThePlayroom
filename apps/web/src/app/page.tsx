export default function HomePage() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: '#0B0708',
      color: '#F6EEF0',
      fontFamily: 'Max, system-ui, sans-serif',
      padding: '32px'
    }}>
      <section style={{ maxWidth: 760, textAlign: 'center' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.2em', color: '#FF2E9A' }}>
          Welcome to The Playroom
        </p>
        <h1 style={{ fontSize: '4rem', margin: '1rem 0', lineHeight: 1.05 }}>
          Privacy-first lifestyle matchmaking for the scene.
        </h1>
        <p style={{ color: '#B69AA1', fontSize: '1.1rem', marginBottom: '2rem' }}>
          Dark theme default. Consent-driven design. Verified profiles, events, and marketplace readiness.
        </p>
      </section>
    </main>
  );
}
