export default function AdminHomePage() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: '#0B0708',
      color: '#F6EEF0',
      padding: '32px',
      fontFamily: 'Max, system-ui, sans-serif'
    }}>
      <section style={{ textAlign: 'center', maxWidth: 760 }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.2em', color: '#FF2E9A' }}>
          Admin dashboard
        </p>
        <h1 style={{ fontSize: '3rem', margin: '1rem 0' }}>Trust & Safety starter dashboard</h1>
        <p style={{ color: '#B69AA1' }}>
          Placeholder admin home screen for verification queues, reports, and moderation workflows.
        </p>
      </section>
    </main>
  );
}
