import Link from 'next/link'

export default function TermsPage({ params }: { params: { locale: string } }) {
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
        Termos de Uso
      </h1>

      <div style={{ color: 'var(--text)', lineHeight: 1.8, fontSize: '0.9rem' }}>
        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>1. Identificação do Operador</h2>
          <p>The Playroom é operado por Amplia Solutions, Lda., uma empresa registada em Portugal.</p>
          <p><strong>Contacto:</strong> legal@theplayroom.pt</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>2. Aceitação dos Termos</h2>
          {/* eslint-disable-next-line react/no-unescaped-entities */}
          <p>Ao aceder ou utilizar The Playroom ("Serviço"), aceita integralmente estes Termos de Uso. Se não aceitar, não utilize o Serviço.</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>3. Elegibilidade</h2>
          <p>Apenas utilizadores com 18 anos ou mais podem utilizar o Serviço. Ao registar-se, confirma que tem pelo menos 18 anos e capacidade legal para celebrar contratos.</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>4. Descrição do Serviço</h2>
          <p>The Playroom é uma plataforma de networking comunitário para adultos que facilita a ligação entre utilizadores com interesses afins, permitindo a partilha segura de informações, mediação de eventos, e comércio entre pares.</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>5. Tipos de Conta</h2>
          <p>O Serviço oferece diversos tipos de conta:</p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Contas individuais (Single Feminina, Single Masculino)</li>
            <li>Contas de casal (Casal MF, MM, FF)</li>
            <li>Contas comerciais (Swing Club, Sex Shop)</li>
          </ul>
          <p style={{ marginTop: '0.5rem' }}>Cada tipo de conta tem direitos e responsabilidades específicas conforme estes Termos.</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>6. Conduta do Utilizador e Conteúdo Proibido</h2>
          <p>Compromete-se a:</p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Respeitar a privacidade e segurança de outros utilizadores</li>
            <li>Não publicar conteúdo ilegal, difamatório, ou que viole direitos de terceiros</li>
            <li>Não partilhar conteúdo que envolva menores (tolerância zero - denúncia às autoridades)</li>
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            <li>Não publicar imagens não consensuais ou conteúdo de "revenge porn"</li>
            <li>Não assediar, discriminar, ou fazer spam</li>
            <li>Não criar perfis falsos ou enganosos</li>
          </ul>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>7. Conteúdo do Utilizador e Licença</h2>
          <p>Ao submeter conteúdo (fotos, texto, vídeos) concede a Amplia Solutions uma licença mundial, royalty-free, não exclusiva, para armazenar, processar, exibir, e utilizar o conteúdo para operar e melhorar o Serviço.</p>
          <p>Retém todos os direitos sobre o seu conteúdo e pode removê-lo a qualquer momento.</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>8. Subscrições e Pagamentos</h2>
          <p><strong>Pagamentos:</strong> Utilizamos Stripe como processador de pagamentos. Todos os pagamentos são processados de forma segura e de acordo com a lei aplicável (PSD2, etc.).</p>
          <p><strong>Cancelamento:</strong> Pode cancelar a subscrição a qualquer momento através das definições da conta.</p>
          <p><strong>Reembolsos:</strong> Conforme política de reembolsos publicada separadamente. Geralmente, reembolsos são processados em até 14 dias após o cancelamento.</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>9. Marketplace e Responsabilidade do Vendedor</h2>
          <p>Vendedores (contas SEX_SHOP) são responsáveis por:</p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Exactidão e legalidade dos produtos oferecidos</li>
            <li>Cumprimento de normas de protecção do consumidor (Directiva 2011/83/UE - Direito de Devolução)</li>
            <li>Cumprimento de regulamentações fiscais (VAT/IVA)</li>
            <li>Responsabilidade civil por danos causados pelos produtos</li>
          </ul>
          <p style={{ marginTop: '0.5rem' }}><strong>Comissão da Plataforma:</strong> 10% por defeito, variável por categoria (7%-15%).</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>10. Suspensão e Rescisão de Conta</h2>
          <p>Amplia Solutions pode suspender ou eliminar a sua conta se:</p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Violar estes Termos</li>
            <li>Participar em actividade ilegal ou prejudicial</li>
            <li>Publicar conteúdo que envolva menores ou exploração</li>
            <li>Violação reincidente das Regras da Comunidade</li>
          </ul>
          <p style={{ marginTop: '0.5rem' }}>Pode solicitar a eliminação da sua conta a qualquer momento, contactando legal@theplayroom.pt.</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>11. Limitação de Responsabilidade</h2>
          {/* eslint-disable-next-line react/no-unescaped-entities */}
          <p>The Playroom é fornecido "tal como está", sem garantias expressas ou implícitas. Na máxima extensão permitida pela lei, Amplia Solutions não é responsável por:</p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Danos indirectos, incidentais, ou consequentes</li>
            <li>Interrupção do Serviço ou indisponibilidade</li>
            <li>Condutas, conteúdo, ou transacções de outros utilizadores</li>
            <li>Perda de dados ou falha de segurança (excepto por negligência grave)</li>
          </ul>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>12. Lei Aplicável e Jurisdição</h2>
          <p>Estes Termos são regidos pela lei portuguesa e pela legislação da União Europeia (RGPD, Directivas de Comércio Electrónico, etc.).</p>
          <p>As partes aceitam a jurisdição exclusiva dos tribunais de Portugal.</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>13. Contacto</h2>
          <p><strong>Para questões legais ou denúncias:</strong> legal@theplayroom.pt</p>
        </section>

        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
          <p>© Amplia Solutions 2026</p>
          <p>Última actualização: Julho 2026</p>
        </div>
      </div>
    </div>
  )
}
