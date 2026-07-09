# The Playroom - Plano de Execução por Sprints

Data: 2026-07-07

## Objetivo

Converter a auditoria de prontidão em um plano de execução pragmático para levar o produto a um estado funcional e lançável em:

- web
- Android
- iOS

## Princípios de priorização

Ordem usada neste plano:

1. desbloquear fluxos estruturais que impedem qualquer uso real;
2. estabilizar a web como superfície principal do produto;
3. fechar as dependências técnicas do mobile;
4. completar requisitos operacionais, legais e de trust & safety;
5. fazer validação final cross-platform.

## Definição de Done global

Considera-se a app pronta para lançamento quando:

1. novo utilizador consegue criar conta, fazer onboarding e entrar no produto sem intervenção manual;
2. a web suporta feed, matches, mensagens, eventos, verificação e marketplace sem gaps críticos conhecidos;
3. Android/iOS passam build de produção e usam autenticação/API reais;
4. pagamentos, notificações, moderação e verificação funcionam end-to-end;
5. compliance mínima para plataforma adulta e marketplace está fechada;
6. há observabilidade, suporte operacional e critérios de rollback.

## Sprint 0 - Estabilização Estrutural

Meta:

- remover os bloqueios que invalidam o restante roadmap.

Prioridade: crítica

### Entregáveis

1. Clerk webhook sincroniza utilizadores para `users`.
2. `PATCH /api/users/me` persiste corretamente os campos de onboarding.
3. fonte única de verdade para schema DB escolhida e planeada.
4. estratégia oficial de autenticação mobile -> API definida.

### Tarefas

#### Auth e utilizadores

- Implementar `user.created`, `user.updated`, `user.deleted` em `apps/web/src/app/api/webhooks/clerk/route.ts`.
- Garantir criação de `users` row mínima com `clerkUserId`, defaults e timestamps.
- Definir reprocessamento idempotente de eventos.
- Criar script/manual de reconciliação para utilizadores já existentes no Clerk.

#### Onboarding

- Corrigir `apps/web/src/app/api/users/me/route.ts` para aceitar:
  - `accountType`
  - `displayName`
  - `dateOfBirth`
  - `ageVerifiedAt`
  - `onboardingComplete`
- Validar payload com schema Zod.
- Garantir consistência com dependências do feed e páginas autenticadas.

#### Dados

- Auditar diferenças entre `packages/db/src/schema.ts` e `packages/db/src/schema/index.ts`.
- Escolher um schema canónico.
- Produzir plano de migração de código e migrations.
- Não expandir novas features até o alinhamento estar decidido.

#### Mobile auth architecture

- Decidir se a API consumida pelo mobile será:
  - o próprio `apps/web/src/app/api`
  - uma API dedicada em `services/api`
- Implementar verificação de bearer token Clerk server-side.
- Validar chamada autenticada real a `/api/users/me` a partir do mobile.

### Critério de saída do Sprint 0

1. novo utilizador criado no Clerk existe automaticamente em `users`;
2. onboarding persiste dados essenciais;
3. feed deixa de depender de estados incoerentes;
4. existe um caminho autenticado comprovado entre mobile e backend.

## Sprint 1 - Web Core Beta

Meta:

- tornar a web usável de forma contínua para o core social do produto.

Prioridade: muito alta

### Entregáveis

1. onboarding web funcional end-to-end.
2. feed/matching/mensagens estáveis.
3. verificação por foto operacional.
4. gestão básica de perfil e fotos estabilizada.

### Tarefas

#### Core social

- Validar navegação completa `sign-up -> onboarding -> kink-test -> feed -> like -> mutual match -> mensagens`.
- Corrigir bugs de estado entre páginas autenticadas.
- Rever limites VIP/free e mensagens de erro.

#### Messaging

- Validar ciclo completo:
  - criação de thread
  - histórico
  - envio
  - entrega em realtime
  - persistência cifrada
- Confirmar gestão de keypair e recuperação em browser.
- Testar conversa entre dois utilizadores reais.

#### Perfil e fotos

- Consolidar o fluxo oficial de upload:
  - decidir entre `/api/photos` e `/api/photos/confirm` como fluxo principal
- Garantir que fotos aprovadas aparecem no feed/perfil.
- Corrigir comportamento de remoção de objetos no storage quando aplicável.

#### Verificação

- Fechar UX da verificação por foto.
- Garantir queue admin utilizável para aprovar/rejeitar.
- Atualizar corretamente `verificationLevel` no utilizador.

### Critério de saída do Sprint 1

1. dois utilizadores reais conseguem interagir do onboarding até mensagens;
2. fotos e verificação por foto funcionam;
3. erros críticos de onboarding/auth desaparecem da web.

## Sprint 2 - Eventos, Clubes e Dashboard Web

Meta:

- completar os percursos web que ainda estão parcialmente em placeholder.

Prioridade: alta

### Entregáveis

1. fluxo `SWING_CLUB` funcional.
2. dashboard autenticada útil.
3. reservas e gestão de eventos utilizáveis.

### Tarefas

#### Club setup

- Implementar `/{locale}/club-setup`.
- Criar/editar clube com nome, descrição, localização e amenities.
- Ligar isso a `POST /api/clubs` e possíveis updates futuros.

#### Gestão de eventos

- Criador deve conseguir:
  - criar eventos
  - ver reservas
  - aceitar/recusar pedidos
- Expor uma UI real para gestão de reservas do host.

#### Dashboard

- Substituir “Em construção” por um hub autenticado real.
- Incluir estado de onboarding, verificação, subscription, loja/clube e notificações.

### Critério de saída do Sprint 2

1. conta `SWING_CLUB` consegue ser criada e usada com fluxo coerente;
2. eventos funcionam do lado do participante e do host;
3. dashboard passa a ser ponto real de navegação do utilizador.

## Sprint 3 - Marketplace Operacional Web

Meta:

- tornar seller onboarding, catálogo e compra suficientemente robustos para uso real.

Prioridade: alta

### Entregáveis

1. seller onboarding Stripe Connect confiável.
2. catálogo moderado utilizável.
3. orders e checkout estabilizados.
4. seller consegue gerir produtos e encomendas.

### Tarefas

#### Seller onboarding

- Testar e endurecer `connect/onboard`, `connect/status` e `connect/dashboard`.
- Validar reentrada no onboarding e estados pendentes/ativos.

#### Catálogo

- Completar gestão de produtos.
- Garantir moderação/admin para aprovar produtos.
- Validar imagens, stock e ativação.

#### Orders e pós-compra

- Implementar fluxo mínimo de estado da encomenda:
  - `pending`
  - `paid`
  - `shipped`
  - `delivered`
  - `refunded/cancelled`
- Expor seller order management.
- Definir processo de refund/cancelamento.

#### Reconciliação financeira

- Validar webhooks Stripe para orders e subscriptions.
- Definir reconciliação e suporte a falhas de webhook.

### Critério de saída do Sprint 3

1. um seller consegue ligar conta, publicar produto aprovado e receber compra válida;
2. buyer consegue completar compra e rever estado;
3. operação básica de marketplace fica suportada.

## Sprint 4 - Mobile Foundation

Meta:

- tirar Android/iOS do estado pré-beta e colocá-los num estado tecnicamente viável.

Prioridade: crítica para mobile

### Entregáveis

1. mobile passa typecheck.
2. auth mobile funciona contra backend real.
3. fluxos base carregam dados autenticados com fiabilidade.

### Tarefas

#### Build correctness

- Corrigir `apps/mobile/app/(auth)/sign-in.tsx` para a API real de `@clerk/expo`.
- Corrigir tipos em `apps/mobile/app/(tabs)/_layout.tsx`.
- Garantir `pnpm --filter the-playroom-mobile typecheck` limpo.

#### Auth/API

- Validar bearer token Clerk em ambiente mobile real.
- Corrigir `apiFetch` e backend até `/api/users/me`, `/api/feed`, `/api/matches`, `/api/events` funcionarem com sessão mobile.

#### Error handling

- Substituir `ignore errors for MVP` por estados reais de erro.
- Adicionar telemetria/crash reporting mobile.

### Critério de saída do Sprint 4

1. mobile autentica e consome dados reais sem hacks locais;
2. build de desenvolvimento e preview torna-se fiável em Android/iOS.

## Sprint 5 - Mobile Product Completion

Meta:

- completar os fluxos mobile mais importantes para paridade aceitável com a web.

Prioridade: alta

### Entregáveis

1. onboarding mobile real.
2. perfil/edit/verificação funcionais.
3. mensagens mobile compatíveis com o modelo cifrado.
4. notificações e deep links mobile funcionais.

### Tarefas

#### Onboarding e perfil

- Implementar sign-up mobile.
- Implementar onboarding mobile equivalente ao web.
- Implementar edição de perfil/fotos/interesses.

#### Messaging segura

- Portar keypair management para mobile.
- Implementar cifragem/decifragem real no mobile.
- Garantir interoperabilidade com mensagens web.

#### Fluxos adicionais

- Integrar verificação.
- Integrar VIP/pricing.
- Integrar detalhe de produto e checkout, se fizer parte do scope mobile do lançamento.

#### Push

- Registrar device tokens.
- Implementar envio de push mobile.
- Tratar deep links ao abrir notificações.

### Critério de saída do Sprint 5

1. Android e iOS cobrem os fluxos sociais principais do produto;
2. mensagens e notificações funcionam de forma consistente;
3. mobile deixa de ser apenas uma casca MVP.

## Sprint 6 - Trust & Safety, Legal e Operação

Meta:

- fechar os requisitos não-funcionais obrigatórios para produção pública.

Prioridade: crítica para lançamento público

### Entregáveis

1. CSAM scanning real.
2. legal/policies finalizadas.
3. observabilidade e suporte operacional mínimos.
4. admin/T&S utilizáveis.

### Tarefas

#### Trust & Safety

- Integrar fornecedor real de CSAM scanning.
- Definir fluxos de incident response.
- Rever reports, moderation e audit logs.

#### Legal/compliance

- Finalizar Terms, Privacy, Cookies, Seller Terms e Acceptable Use.
- Rever consentimentos e retenção de dados.
- Confirmar adequação a RGPD/PSD2/marketplace obligations.

#### Operação

- Adicionar logging estruturado.
- Adicionar error tracking.
- Definir alertas operacionais.
- Criar runbooks de suporte.

### Critério de saída do Sprint 6

1. o produto fica apto para exposição pública controlada do ponto de vista operacional e legal.

## Sprint 7 - Release Candidate e Go-Live

Meta:

- executar validação final de web, Android e iOS antes de publicação.

### Entregáveis

1. web RC validado.
2. Android RC validado.
3. iOS RC validado.

### Tarefas

#### QA funcional por persona

- single
- casal
- swing club
- sex shop
- admin/moderator

#### QA técnico

- smoke test de webhooks
- smoke test de push
- smoke test de storage/media
- smoke test de pagamentos

#### Store/distribution readiness

- ícones e splash finais
- screenshots
- metadata de store
- age ratings e disclosures
- privacy manifests / store disclosures

### Critério de saída do Sprint 7

1. existe evidência verificável de que as três plataformas executam os fluxos suportados sem blockers críticos;
2. rollout, monitorização e rollback estão definidos.

## Roadmap curto sugerido

Se o objetivo for maximizar velocidade com menor risco:

1. Sprint 0
2. Sprint 1
3. Sprint 2
4. Sprint 6 em paralelo parcial
5. Sprint 4
6. Sprint 5
7. Sprint 3 ou Sprint 3 parcial, conforme a prioridade real do marketplace no go-live
8. Sprint 7

## Recomendação final

Se houver pressão para lançamento rápido, a abordagem mais racional é:

1. lançar primeiro uma web beta controlada;
2. só depois fechar Android/iOS com autenticação e mensagens seguras corretas;
3. não considerar produção pública antes de CSAM real, sync Clerk->DB e onboarding consistente.