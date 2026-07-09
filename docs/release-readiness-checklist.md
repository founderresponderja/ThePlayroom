# The Playroom - Checklist Técnica Acionável

Data: 2026-07-07

## Como usar esta checklist

Marcar cada item como:

- `[ ]` por fazer
- `[~]` em curso
- `[x]` concluído

## A. Blockers Estruturais

### A1. Utilizadores e autenticação

- [ ] Implementar sync real de Clerk webhook para `users`
- [ ] Criar lógica idempotente para `user.created`
- [ ] Criar lógica idempotente para `user.updated`
- [ ] Criar lógica segura para `user.deleted`
- [ ] Validar que novo utilizador autenticado existe na DB antes do onboarding
- [ ] Criar processo de backfill/reconciliação para utilizadores já existentes

### A2. Onboarding

- [ ] Corrigir `PATCH /api/users/me` para persistir `accountType`
- [ ] Corrigir `PATCH /api/users/me` para persistir `dateOfBirth`
- [ ] Corrigir `PATCH /api/users/me` para persistir `ageVerifiedAt`
- [ ] Corrigir `PATCH /api/users/me` para persistir `onboardingComplete`
- [ ] Validar payload de onboarding com schema
- [ ] Testar `sign-up -> onboarding -> feed`

### A3. Dados

- [ ] Comparar `packages/db/src/schema.ts` com `packages/db/src/schema/index.ts`
- [ ] Escolher schema canónico
- [ ] Alinhar runtime com schema canónico
- [ ] Alinhar migrations com schema canónico
- [ ] Validar impacto em dados existentes

### A4. Estratégia backend mobile

- [ ] Definir backend oficial para consumo mobile
- [ ] Implementar autenticação bearer Clerk server-side
- [ ] Validar `/api/users/me` a partir da app mobile
- [ ] Validar `/api/feed` a partir da app mobile
- [ ] Validar `/api/messages` a partir da app mobile

## B. Web Core

### B1. Fluxo social principal

- [ ] Sign-up web funcional
- [ ] Sign-in web funcional
- [ ] Onboarding web funcional
- [ ] Kink test funcional
- [ ] Feed funcional
- [ ] Like/pass funcional
- [ ] Mutual match funcional
- [ ] Criação/abertura de thread funcional
- [ ] Mensagens web cifradas funcionais
- [ ] Realtime web funcional

### B2. Perfil e fotos

- [ ] Definir um único fluxo principal de upload de fotos
- [ ] Garantir persistência correta de fotos
- [ ] Garantir remoção correta de fotos/storage
- [ ] Garantir foto principal correta
- [ ] Garantir fotos aprovadas no perfil/feed
- [ ] Editor de perfil funcional

### B3. Verificação

- [ ] Upload de selfie funcional
- [ ] Submissão de verificação funcional
- [ ] Queue admin de verificação funcional
- [ ] Aprovação/rejeição funcional
- [ ] `verificationLevel` atualizado corretamente no utilizador
- [ ] Decidir scope de vídeo/social para o lançamento

### B4. Eventos e clubes

- [ ] `club-setup` implementado
- [ ] Criação de clube funcional
- [ ] Edição de clube funcional
- [ ] Criação de evento funcional
- [ ] Listagem de eventos funcional
- [ ] Reserva de evento funcional
- [ ] Waitlist funcional
- [ ] Aceitação de reserva pelo host funcional
- [ ] UI de gestão de reservas para host funcional

### B5. Dashboard e navegação autenticada

- [ ] Dashboard deixa de estar “em construção”
- [ ] Dashboard mostra estado real do utilizador
- [ ] Links principais do utilizador funcionam
- [ ] Gestão de onboarding incompleto funcional

## C. Marketplace Web

### C1. Seller onboarding

- [ ] `connect/onboard` validado
- [ ] `connect/status` validado
- [ ] `connect/dashboard` validado
- [ ] Fluxo de reentrada no onboarding validado

### C2. Catálogo

- [ ] Criação de produto funcional
- [ ] Aprovação de produto funcional
- [ ] Ativação de produto funcional
- [ ] Edição de produto funcional
- [ ] Desativação de produto funcional
- [ ] Upload/imagens de produto validados

### C3. Orders e checkout

- [ ] Criação de order funcional
- [ ] Checkout session funcional
- [ ] Stripe webhook marca order como `paid`
- [ ] UI buyer de encomendas funcional
- [ ] UI seller de encomendas funcional
- [ ] Estados pós-compra definidos
- [ ] Processo de refund/cancelamento definido

## D. Admin / Trust & Safety

### D1. Admin funcional

- [ ] RBAC admin validado
- [ ] Queue de verificação utilizável
- [ ] Queue de reports utilizável
- [ ] Queue de moderação de fotos utilizável
- [ ] Gestão de utilizadores moderáveis funcional

### D2. CSAM / moderação

- [ ] Integrar fornecedor real de CSAM scanning
- [ ] Definir falha segura em produção
- [ ] Definir reporting de incidentes
- [ ] Validar moderação humana de fotos

## E. Web Push

- [ ] Criar `apps/web/public/icons/pineapple-192.png`
- [ ] Criar `apps/web/public/icons/pineapple-72.png`
- [ ] Validar `manifest.json`
- [ ] Validar `sw.js`
- [ ] Testar subscribe web push
- [ ] Testar unsubscribe web push
- [ ] Testar entrega real de notificação

## F. Mobile - Build e Base Técnica

### F1. Typecheck e build

- [ ] Corrigir `app/(auth)/sign-in.tsx`
- [ ] Corrigir `app/(tabs)/_layout.tsx`
- [ ] Passar `pnpm --filter the-playroom-mobile typecheck`
- [ ] Validar build EAS preview Android
- [ ] Validar build EAS preview iOS

### F2. Auth/API mobile

- [ ] Sessão Clerk mobile funcional
- [ ] Bearer token reconhecido pelo backend
- [ ] `/api/users/me` funcional no mobile
- [ ] `/api/feed` funcional no mobile
- [ ] `/api/events` funcional no mobile
- [ ] `/api/matches` funcional no mobile
- [ ] `/api/messages` funcional no mobile

### F3. UX e erros mobile

- [ ] Remover `ignore errors for MVP` dos ecrãs principais
- [ ] Mostrar mensagens de erro úteis ao utilizador
- [ ] Adicionar crash/error tracking mobile

## G. Mobile - Produto

### G1. Conta e onboarding

- [ ] Sign-up mobile funcional
- [ ] Onboarding mobile funcional
- [ ] Edição de perfil mobile funcional
- [ ] Gestão de fotos mobile funcional

### G2. Messaging mobile

- [ ] Portar keypair management para mobile
- [ ] Implementar cifragem no envio
- [ ] Implementar decifragem na leitura
- [ ] Garantir interoperabilidade web/mobile
- [ ] Testar conversa real web <-> mobile

### G3. Notificações mobile

- [ ] Registrar device tokens Android
- [ ] Registrar device tokens iOS
- [ ] Backend para envio de push mobile
- [ ] Deep links a partir de notificações
- [ ] Teste foreground Android
- [ ] Teste background Android
- [ ] Teste foreground iOS
- [ ] Teste background iOS

### G4. Pagamentos mobile

- [ ] Definir estratégia oficial de checkout mobile
- [ ] Implementar fluxo de pagamento mobile
- [ ] Garantir retorno seguro à app
- [ ] Testar subscription mobile
- [ ] Testar marketplace checkout mobile, se estiver no scope

## H. Assets e Distribuição Mobile

- [ ] Criar `adaptive-icon.png`
- [ ] Criar `splash.png`
- [ ] Rever `icon.png` final
- [ ] Validar branding Android
- [ ] Validar branding iOS
- [ ] Rever metadata EAS/owner/project settings
- [ ] Preparar screenshots Android
- [ ] Preparar screenshots iOS
- [ ] Rever age rating das stores
- [ ] Rever disclosures/privacy das stores

## I. Legal / Compliance / Operação

### I1. Legal

- [ ] Finalizar Terms of Use
- [ ] Finalizar Privacy Policy
- [ ] Finalizar Cookie Policy
- [ ] Finalizar Seller Terms
- [ ] Finalizar Acceptable Use Policy

### I2. Compliance operacional

- [ ] Rever RGPD
- [ ] Rever PSD2 / pagamentos
- [ ] Rever obrigações marketplace
- [ ] Rever política de account deletion e retenção de dados
- [ ] Rever consentimentos persistidos

### I3. Observabilidade e suporte

- [ ] Logging estruturado para backend
- [ ] Error tracking para web
- [ ] Error tracking para mobile
- [ ] Alertas operacionais
- [ ] Runbook para auth issues
- [ ] Runbook para payment issues
- [ ] Runbook para moderation/verification issues

## J. QA Final de Lançamento

### J1. Personas

- [ ] Teste completo como single
- [ ] Teste completo como casal
- [ ] Teste completo como swing club
- [ ] Teste completo como sex shop
- [ ] Teste completo como admin/moderator

### J2. Plataformas

- [ ] Teste web desktop
- [ ] Teste web mobile browser
- [ ] Teste Android físico
- [ ] Teste iPhone físico

### J3. Fluxos críticos

- [ ] Auth/signup/signin
- [ ] Onboarding
- [ ] Feed/matching
- [ ] Messaging
- [ ] Fotos/upload/moderação
- [ ] Verificação
- [ ] Eventos/reservas
- [ ] Seller onboarding
- [ ] Produto/checkout/order
- [ ] Notificações
- [ ] Webhooks

## Fecho

Se esta checklist estiver toda marcada, a probabilidade de a app estar realmente pronta para web, Android e iOS é alta. Enquanto os itens das secções A, B1, F1 e F2 não estiverem fechados, a app não deve ser considerada “totalmente funcional”.