import Link from 'next/link'

export default function GuidelinesPage({ params }: { params: { locale: string } }) {
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
        Regras da Comunidade
      </h1>

      <div style={{ color: 'var(--text)', lineHeight: 1.8, fontSize: '0.9rem' }}>
        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>1. Princípios Fundamentais</h2>
          <p>The Playroom é uma comunidade baseada em três princípios:</p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li><strong>Consentimento:</strong> Todas as interacções devem ser consensuais e respeitosas</li>
            <li><strong>Respeito:</strong> Trate outros membros com dignidade e respeito</li>
            <li><strong>Privacidade:</strong> Proteja a privacidade e confidencialidade de outros</li>
          </ul>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>2. O que é Permitido</h2>
          <p>Conteúdo adulto consensual entre adultos (18+):</p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Partilha de fotos e vídeos de adultos (consentimento informado obrigatório)</li>
            <li>Discussão aberta sobre sexualidade, preferências, e interesses</li>
            <li>Networking comunitário e conexões consensuais</li>
            <li>Venda de produtos adultos legais (para contas de vendedor)</li>
          </ul>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>3. O que NÃO é Permitido (Tolerância Zero)</h2>

          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>3.1 Conteúdo de Menores</h3>
            <p><strong>Tolerância Zero.</strong> Qualquer conteúdo que envolva menores (pessoas com menos de 18 anos), incluindo:</p>
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Imagens ou vídeos sexuais de menores (CSAM)</li>
              <li>Exploração sexual de menores</li>
              <li>Conteúdo que sexualiza menores de qualquer forma</li>
            </ul>
            <p style={{ marginTop: '0.5rem' }}><strong>Consequência:</strong> Eliminação imediata da conta, denúncia às autoridades competentes (Polícia Judiciária, NCMEC).</p>
          </div>

          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>3.2 Imagens Não Consensuais (NCII / Revenge Porn)</h3>
            <p>Partilha de imagens ou vídeos íntimos sem consentimento explícito da pessoa retratada.</p>
            <p><strong>Consequência:</strong> Eliminação imediata de conteúdo, suspensão ou ban permanente.</p>
          </div>

          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>3.3 Assédio e Abuso</h3>
            <p>Comportamento que prejudica ou intimida outros membros:</p>
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Mensagens sexuais não solicitadas ou repetidas depois de recusa</li>
              <li>Insultos, ameaças, ou discriminação (baseada em género, raça, orientação sexual, etc.)</li>
              <li>Perseguição (stalking) ou contacto contínuo após bloqueio</li>
            </ul>
            <p style={{ marginTop: '0.5rem' }}><strong>Consequência:</strong> Aviso, suspensão temporária (1-30 dias), ou ban permanente conforme severidade.</p>
          </div>

          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>3.4 Spam e Publicidade</h3>
            <p>Mensagens repetidas ou publicidade não autorizada.</p>
            <p><strong>Consequência:</strong> Remoção de conteúdo, suspensão de privilégios de mensagem, ou ban.</p>
          </div>

          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>3.5 Perfis Falsos ou Enganosos</h3>
            <p>Criar perfis com informação falsa, impersonação, ou intent fraudulenta.</p>
            <p><strong>Consequência:</strong> Eliminação de conta, ban permanente.</p>
          </div>

          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>3.6 Conteúdo Ilegal</h3>
            <p>Qualquer conteúdo que viole a lei portuguesa ou europeia, incluindo:</p>
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Materiais de narcóticos ou armas ilegais</li>
              <li>Incitamento à violência ou terrorismo</li>
              <li>Fraude, phishing, ou scams</li>
            </ul>
            <p style={{ marginTop: '0.5rem' }}><strong>Consequência:</strong> Eliminação imediata, denúncia às autoridades.</p>
          </div>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>4. Como Denunciar Conteúdo</h2>
          <p>Se encontra conteúdo que viola estas regras:</p>
          <ol style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            <li>Utilize o botão de "Denunciar" no perfil ou conteúdo</li>
            <li>Forneça detalhes específicos sobre a violação</li>
            <li>Aguarde resposta da nossa equipa de moderação (até 48 horas)</li>
          </ol>
          <p style={{ marginTop: '0.5rem' }}><strong>Contacto directo:</strong> safety@theplayroom.pt</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>5. Consequências de Violações</h2>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li><strong>1ª Violação Menor:</strong> Aviso escrito</li>
            <li><strong>2ª Violação:</strong> Suspensão temporária (1-7 dias)</li>
            <li><strong>3ª Violação ou Violação Grave:</strong> Suspensão prolongada (1-30 dias) ou ban permanente</li>
            <li><strong>Violações Graves (CSAM, Illegal Content):</strong> Ban permanente imediato, denúncia às autoridades</li>
          </ul>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>6. Apelo de Decisões</h2>
          <p>Se acredita que a sua conta foi suspensa por engano, pode apelar contactando safety@theplayroom.pt com:</p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Número da sua conta</li>
            <li>Explicação clara do incidente</li>
            <li>Qualquer evidência suportante</li>
          </ul>
          <p style={{ marginTop: '0.5rem' }}>Uma análise manual será realizada em até 7 dias.</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>7. Contacto de Segurança</h2>
          <p><strong>Para denúncias de segurança e conteúdo ilegal:</strong> safety@theplayroom.pt</p>
        </section>

        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
          <p>© Amplia Solutions 2026</p>
          <p>Última actualização: Julho 2026</p>
        </div>
      </div>
    </div>
  )
}
