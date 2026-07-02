import Link from 'next/link'

export default function PrivacyPage({ params }: { params: { locale: string } }) {
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
        Política de Privacidade e RGPD
      </h1>

      <div style={{ color: 'var(--text)', lineHeight: 1.8, fontSize: '0.9rem' }}>
        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>1. Responsável pelo Tratamento de Dados</h2>
          <p><strong>Controlador de Dados:</strong> Amplia Solutions, Lda., Portugal</p>
          <p><strong>Contacto do Encarregado de Protecção de Dados (DPO):</strong> legal@theplayroom.pt</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>2. Dados Recolhidos e Finalidade</h2>
          <p>Recolhemos os seguintes dados para fornecer o Serviço:</p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li><strong>Dados de Identificação:</strong> Nome, e-mail, data de nascimento (para verificação de idade)</li>
            <li><strong>Dados de Conta:</strong> Username, foto de perfil, tipo de conta, histórico de actividade</li>
            <li><strong>Dados de Preferência:</strong> Interesses, tags de kink, preferências de segurança</li>
            <li><strong>Dados de Comunicação:</strong> Mensagens directas (encriptadas), histórico de conversas</li>
            <li><strong>Dados de Transacção:</strong> Histórico de compras, pagamentos (processados por Stripe)</li>
            <li><strong>Dados Técnicos:</strong> Endereço IP, tipo de dispositivo, histórico de navegação</li>
          </ul>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>3. Base Legal (Artigo 6, RGPD)</h2>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li><strong>Consentimento (Art. 6.1.a):</strong> Ao registar-se, consente o tratamento dos seus dados</li>
            <li><strong>Execução do Contrato (Art. 6.1.b):</strong> Dados necessários para fornecer o Serviço (pagamentos, mensagens, etc.)</li>
            <li><strong>Obrigação Legal (Art. 6.1.c):</strong> Cumprimento de leis e regulamentações (anti-fraude, KYC para vendedores)</li>
            <li><strong>Interesse Legítimo (Art. 6.1.f):</strong> Segurança, prevenção de abuso, analítica e melhoria do Serviço</li>
          </ul>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>4. Dados Sensíveis (Artigo 9, RGPD)</h2>
          <p><strong>Preferências Sexuais e de Saúde:</strong> As preferências de kink e informações relacionadas são dados sensíveis sob o Artigo 9 do RGPD.</p>
          <p><strong>Consentimento Explícito:</strong> Ao aceitar a Política de Privacidade, concede consentimento explícito para o tratamento destes dados, conforme necessário para fornecer o Serviço de rede comunitária.</p>
          <p><strong>Segurança:</strong> Estes dados são armazenados de forma encriptada (AES-256 em repouso, TLS em trânsito) e acesso restrito.</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>5. Partilha de Dados com Terceiros</h2>
          <p>Os seus dados podem ser partilhados com as seguintes categorias de processadores:</p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li><strong>Clerk (Autenticação):</strong> Dados de login e identidade (conforme Política de Privacidade de Clerk)</li>
            <li><strong>Stripe (Processamento de Pagamentos):</strong> Dados de pagamento (conforme Política de Privacidade de Stripe)</li>
            <li><strong>Cloudflare (CDN/Segurança):</strong> Dados de tráfego e segurança (conforme Política de Privacidade de Cloudflare)</li>
            <li><strong>Ably (Mensagens em Tempo Real):</strong> Dados de comunicação (conforme Política de Privacidade de Ably)</li>
            <li><strong>Neon/Vercel (Hospedagem):</strong> Dados da aplicação, backups (conforme Política de Privacidade)</li>
          </ul>
          <p style={{ marginTop: '0.5rem' }}>Todos os processadores foram seleccionados conforme requisitos de protecção de dados e RGPD.</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>6. Transferências Internacionais de Dados</h2>
          <p>Alguns processadores (Stripe, Cloudflare, Vercel) podem estar localizados fora da UE.</p>
          <p>Utilizamos Cláusulas Contratuais Padrão (SCCs) e outras garantias conforme RGPD para assegurar protecção adequada.</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>7. Retenção de Dados</h2>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li><strong>Dados de Conta Activa:</strong> Mantidos enquanto a conta estiver activa</li>
            <li><strong>Conta Eliminada:</strong> Dados anonimizados ou eliminados em até 30 dias, excepto conforme exigido por lei</li>
            <li><strong>Dados de Transacção:</strong> Mantidos por 7 anos (requisito fiscal)</li>
            <li><strong>Dados de Segurança/Auditoria:</strong> Mantidos por até 90 dias</li>
          </ul>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>8. Direitos do Titular de Dados</h2>
          <p>Tem o direito de:</p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li><strong>Direito de Acesso (Art. 15):</strong> Aceder aos seus dados a qualquer momento</li>
            <li><strong>Direito de Rectificação (Art. 16):</strong> Corrigir dados inexactos</li>
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            <li><strong>Direito ao Apagamento (Art. 17):</strong> Solicitar eliminação de dados ("direito ao esquecimento")</li>
            <li><strong>Direito à Limitação (Art. 18):</strong> Limitar o processamento dos dados</li>
            <li><strong>Direito à Portabilidade (Art. 20):</strong> Receber os seus dados em formato estruturado</li>
            <li><strong>Direito à Oposição (Art. 21):</strong> Opor-se ao processamento para fins específicos</li>
          </ul>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>9. Como Exercer os Seus Direitos</h2>
          <p>Para exercer qualquer destes direitos, contacte-nos em: <strong>legal@theplayroom.pt</strong></p>
          <p>Responderemos dentro de 30 dias (RGPD Art. 12).</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>10. Reclamações</h2>
          <p>Se não ficar satisfeito com a resposta, tem o direito de apresentar uma reclamação à autoridade de supervisão competente:</p>
          <p><strong>CNPD - Comissão Nacional de Protecção de Dados, Portugal</strong></p>
          <p>www.cnpd.pt</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>11. Cookies e Rastreamento</h2>
          <p>Para informações sobre cookies, consulte a nossa <strong>Política de Cookies</strong>.</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>12. Segurança</h2>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li><strong>Encriptação End-to-End:</strong> Mensagens são encriptadas (NaCl sealed boxes)</li>
            <li><strong>TLS em Trânsito:</strong> Todos os dados em trânsito utilizam TLS 1.2+</li>
            <li><strong>Encriptação em Repouso:</strong> Base de dados encriptada (Neon at-rest encryption)</li>
            <li><strong>Políticas de Acesso:</strong> Acesso à dados pessoais restrito ao pessoal autorizado</li>
          </ul>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>13. Contacto</h2>
          <p><strong>Encarregado de Protecção de Dados (DPO):</strong> legal@theplayroom.pt</p>
        </section>

        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
          <p>© Amplia Solutions 2026</p>
          <p>Última actualização: Julho 2026</p>
        </div>
      </div>
    </div>
  )
}
