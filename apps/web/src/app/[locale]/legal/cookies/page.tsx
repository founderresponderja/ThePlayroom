import Link from 'next/link'

export default function CookiesPage({ params }: { params: { locale: string } }) {
  return (
    <div>
      <Link
        href={`/${params.locale}/legal`}
        style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'inline-block' }}
      >
        ← Voltar
      </Link>

      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--primary)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '0.8rem' }}>
        ⚠️ <strong>AVISO IMPORTANTE:</strong> Este documento é um rascunho e deve ser revisto por um advogado qualificado antes do lançamento público.
      </div>

      <h1 style={{ color: 'var(--text)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        Política de Cookies
      </h1>

      <div style={{ color: 'var(--text)', lineHeight: 1.8, fontSize: '0.9rem' }}>
        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>1. O que são Cookies?</h2>
          <p>Cookies são pequenos ficheiros de texto que são armazenados no seu dispositivo quando visita um website. Permitem ao website recordar informações sobre a sua visita, como preferências ou estado de login.</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>2. Tipos de Cookies que Utilizamos</h2>

          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>2.1 Cookies Necessários (Autenticação e Sessão)</h3>
            <p><strong>Fornecedor:</strong> Clerk (plataforma de autenticação)</p>
            <p><strong>Finalidade:</strong> Manter a sua sessão de login, autenticação segura, prevenção de fraude</p>
            <p><strong>Duração:</strong> Até 30 dias (configurável)</p>
            <p><strong>Consentimento:</strong> Não é necessário consentimento - estes cookies são essenciais para o funcionamento da plataforma</p>
          </div>

          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>2.2 Cookies de Preferências (Funcionais)</h3>
            <p><strong>Finalidade:</strong> Recordar preferências (tema dark/light, idioma, configurações de segurança)</p>
            <p><strong>Duração:</strong> Até 1 ano</p>
            <p><strong>Consentimento:</strong> Recomenda-se consentimento, mas funcionam mesmo sem (fallback para predefinições)</p>
          </div>

          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>2.3 Cookies de Analytics (Se Aplicável)</h3>
            <p><strong>Finalidade:</strong> Compreender como os utilizadores utilizam o Serviço, melhorias de desempenho</p>
            <p><strong>Consentimento Obrigatório:</strong> Sim - consentimento explícito é necessário para analytics</p>
            <p><strong>Fornecedores Potenciais:</strong> Google Analytics, Mixpanel (a implementar conforme necessário)</p>
          </div>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>3. Como Gerir Cookies</h2>
          <p>Pode gerir ou bloquear cookies através das definições do seu navegador:</p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li><strong>Chrome:</strong> Definições → Privacidade e segurança → Cookies e dados de sites</li>
            <li><strong>Firefox:</strong> Definições → Privacidade e segurança → Cookies e dados de sites</li>
            <li><strong>Safari:</strong> Preferências → Privacidade → Gerir dados de websites</li>
            <li><strong>Edge:</strong> Definições → Privacidade e segurança → Cookies e outras permissões</li>
          </ul>
          <p style={{ marginTop: '0.5rem' }}><strong>Nota:</strong> Bloquear cookies necessários pode impedir o login e funcionalidades essenciais.</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>4. Consentimento e Revogação</h2>
          <p>Ao visitar The Playroom, um banner de consentimento é apresentado permitindo-lhe:</p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Aceitar todos os cookies</li>
            <li>Rejeitar cookies opcionais (mantendo apenas os necessários)</li>
            <li>Personalizar as suas preferências de cookies</li>
          </ul>
          <p style={{ marginTop: '0.5rem' }}>Pode revogar o consentimento a qualquer momento a partir das definições da sua conta.</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>5. Contacto</h2>
          <p>Para questões sobre cookies, contacte-nos em: <strong>legal@theplayroom.pt</strong></p>
        </section>

        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
          <p>© Amplia Solutions 2026</p>
          <p>Última actualização: Julho 2026</p>
        </div>
      </div>
    </div>
  )
}
