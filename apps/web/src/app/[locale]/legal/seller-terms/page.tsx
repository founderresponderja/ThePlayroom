import Link from 'next/link'

export default function SellerTermsPage({ params }: { params: { locale: string } }) {
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
        Termos de Vendedor
      </h1>

      <div style={{ color: 'var(--text)', lineHeight: 1.8, fontSize: '0.9rem' }}>
        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>1. Elegibilidade</h2>
          <p>Para operar uma loja (conta SEX_SHOP) em The Playroom, deve:</p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Ser maior de 18 anos</li>
            <li>Ser titular de uma empresa registada ou pessoa individual com capacidade legal</li>
            <li>Estar registado ou possuir número de identificação fiscal válido</li>
            <li>Aceitar integralmente estes Termos de Vendedor</li>
          </ul>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>2. Onboarding via Stripe Connect</h2>
          <p><strong>KYC Obrigatório:</strong> Stripe Connect requer verificação de identidade (KYC) antes de processar pagamentos.</p>
          <p>Deve fornecer:</p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Identificação pessoal (cartão de cidadão, passaporte)</li>
            <li>Informação bancária para recebimento de payouts</li>
            <li>Informação da empresa (se aplicável)</li>
          </ul>
          <p style={{ marginTop: '0.5rem' }}><strong>Responsabilidade:</strong> Stripe é responsável pelo processo KYC. Amplia Solutions não armazena documentos sensíveis.</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>3. Produtos Permitidos</h2>
          <p>Artigos adultos legais e apropriados:</p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Produtos de bem-estar sexual (vibrador, lubrificantes, etc.)</li>
            <li>Roupas e acessórios adultos</li>
            <li>Livros e guias educacionais adultos</li>
            <li>Qualquer produto legal relevante à comunidade adulta</li>
          </ul>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>4. Produtos Proibidos</h2>
          <p><strong>Tolerância Zero para:</strong></p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Qualquer item ilegal conforme lei portuguesa ou europeia</li>
            <li>Conteúdo CSAM (Child Sexual Abuse Material) ou exploração de menores</li>
            <li>Produtos falsificados ou de marca registada não autorizada</li>
            <li>Armas, explosivos, ou drogas ilegais</li>
            <li>Produtos que incumpram regulamentações de segurança (CE)</li>
          </ul>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>5. Comissão da Plataforma</h2>
          <p><strong>Taxa Padrão:</strong> 10% sobre o valor bruto da transacção</p>
          <p><strong>Taxas por Categoria (variável):</strong> 7%-15% conforme produto e categoria</p>
          <p><strong>Exemplo:</strong> Venda de €100 com 10% de comissão = €10 para plataforma, €90 para vendedor (antes de taxes/fees de Stripe)</p>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>6. Pagamentos e Payouts</h2>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li><strong>Processador:</strong> Stripe Connect (não Amplia Solutions)</li>
            <li><strong>Frequência de Payouts:</strong> Semanal (sexta-feira) por padrão, conforme Stripe</li>
            <li><strong>Prazos:</strong> 1-3 dias úteis após payout ser processado</li>
            <li><strong>Fees de Stripe:</strong> Taxa de processamento de Stripe (2.9% + €0.30 por transacção, típicamente)</li>
            <li><strong>Retenção:</strong> Stripe pode reter saldo por 7-30 dias conforme conformidade</li>
          </ul>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>7. Responsabilidades do Vendedor</h2>

          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>7.1 Conformidade Fiscal</h3>
            <p>Você é responsável por:</p>
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Relatar rendimentos obtidos (Finanças / IRS)</li>
              <li>Pagar IVA conforme aplicável (regra da UE de 21% ou taxa reduzida)</li>
              <li>Registar a actividade como vendedor se operador de negócio</li>
            </ul>
          </div>

          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>7.2 Informação do Produto</h3>
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Descrição exacta e honesta dos produtos</li>
              <li>Indicação clara de material, composição, e warnings (alérgenos, etc.)</li>
              <li>Fotos claras e representativas</li>
              <li>Preço correcto e sem ocultações</li>
            </ul>
          </div>

          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>7.3 Direito de Devolução (UE - 14 dias)</h3>
            <p>Conforme Directiva 2011/83/UE, o cliente tem direito a devolver produtos dentro de 14 dias sem justificação, excepto:</p>
            <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>Produtos abertos/usados (excepto teste razoável)</li>
              <li>Produtos personalizados</li>
            </ul>
            <p style={{ marginTop: '0.5rem' }}>Você deve processar devoluções e reembolsos conforme lei.</p>
          </div>

          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>7.4 Responsabilidade Civil</h3>
            <p>Você é responsável por danos causados pelos seus produtos, incluindo lesões, reacções alérgicas, ou falha de produto. Recomenda-se seguro de responsabilidade civil.</p>
          </div>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>8. Moderação e Remoção de Produtos</h2>
          <p>Amplia Solutions reserva-se o direito de:</p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Remover produtos que violem os Termos de Vendedor sem aviso prévio</li>
            <li>Suspender a loja se produtos ilegais ou CSAM são detectados</li>
            <li>Cooperar com autoridades conforme requerido por lei</li>
          </ul>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>9. Rescisão da Conta de Vendedor</h2>
          <p><strong>Rescisão por Vendedor:</strong> Pode encerrar a loja a qualquer momento contactando sellers@theplayroom.pt</p>
          <p><strong>Rescisão por Plataforma:</strong> Amplia Solutions pode encerrar a loja se:</p>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Venda de produtos ilegais ou proibidos (CSAM, drogas, armas)</li>
            <li>Fraude ou chargeback reincidente</li>
            <li>Violação grave dos Termos de Vendedor</li>
            <li>Inactividade prolongada (60+ dias sem pedidos)</li>
          </ul>
        </section>

        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--text)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>10. Contacto de Vendedor</h2>
          <p><strong>Para questões de vendedor:</strong> sellers@theplayroom.pt</p>
        </section>

        <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
          <p>© Amplia Solutions 2026</p>
          <p>Última actualização: Julho 2026</p>
        </div>
      </div>
    </div>
  )
}
