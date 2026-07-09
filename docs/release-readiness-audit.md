# The Playroom - Auditoria de Prontidão para Web / Android / iOS

Data: 2026-07-07

## 1. Resumo Executivo

O projeto já tem uma base funcional relevante na web, mas ainda não está pronto para ser considerado “totalmente funcional” em produção nas três superfícies pedidas. A situação atual é esta:

- `web`: tecnicamente construível e com grande parte dos fluxos de produto implementados, mas ainda com gaps funcionais, operacionais e de compliance que impedem um lançamento sólido.
- `android` / `ios`: a app mobile está num estado de MVP parcial, não passa typecheck e depende de uma camada de autenticação/API que, na forma atual, muito provavelmente não funciona de ponta a ponta com Clerk mobile.

Em termos práticos:

- a web está relativamente perto de um beta controlado, desde que se corrijam alguns bloqueios de backend e de produto;
- Android/iOS ainda requerem trabalho estrutural antes de poderem ser considerados prontos para produção.

## 2. Estado Atual Verificado

## O que foi validado nesta auditoria

- `pnpm --filter web typecheck` -> passa
- `pnpm --filter web build` -> passa
- `pnpm --filter the-playroom-mobile typecheck` -> falha com erros TypeScript reais
- `pnpm --filter @playroom/api typecheck` -> passa
- `pnpm --filter @playroom/realtime typecheck` -> passa
- `pnpm --filter @playroom/workers typecheck` -> passa

## Observações estruturais relevantes

- A lógica real do produto está concentrada em `apps/web`.
- `services/api`, `services/realtime` e `services/workers` passam typecheck, mas ainda são essencialmente stubs.
- A app mobile consome a API web remota via `Authorization: Bearer <token>`, mas a API em `apps/web` usa sistematicamente `auth()` de `@clerk/nextjs/server`, sem evidência de um bridge explícito para tokens mobile bearer.
- Há duas definições de schema no pacote `db`, o que aumenta o risco de inconsistência entre runtime e migrations.

## 3. Conclusão de Alto Nível

Para que a app fique totalmente funcional em web/android/iOS, o trabalho remanescente divide-se em 5 grandes blocos:

1. Fechar blockers transversais de backend, dados e autenticação.
2. Completar os fluxos de produto que ainda estão parciais na web.
3. Tornar a app mobile tecnicamente buildável e funcional com autenticação e dados reais.
4. Implementar componentes operacionais obrigatórios para uma plataforma adulta: moderação, verificação, CSAM, legal e suporte.
5. Preparar distribuição e observabilidade de produção para web, Android e iOS.

## 4. Blockers Críticos Transversais

Estes pontos afetam mais do que uma plataforma e devem ser tratados antes de falar em “fully functional”.

### 4.1 Sincronização de utilizadores Clerk -> DB está incompleta

Estado atual:

- `POST /api/webhooks/clerk` valida assinatura Svix, mas não cria/atualiza/remove utilizadores na DB.

Impacto:

- vários fluxos assumem a existência de `users` row interna;
- qualquer utilizador autenticado no Clerk mas não sincronizado para `users` cai em `404 User not found` em APIs críticas.

Passos em falta:

1. Implementar sync real de `user.created`, `user.updated`, `user.deleted`.
2. Garantir criação de `users` row com campos mínimos para onboarding.
3. Definir idempotência e política de retries para webhooks.
4. Criar testes de integração para garantir que novo utilizador Clerk fica disponível para as APIs imediatamente.

### 4.2 Onboarding não persiste o que a UI pensa que persiste

Estado atual:

- `OnboardingWizard` envia `accountType`, `ageVerifiedAt`, `onboardingComplete` e `dateOfBirth` para `PATCH /api/users/me`.
- o handler atual só atualiza `display_name`.

Impacto:

- feed e páginas autenticadas dependem de `onboardingComplete`;
- segmentação por tipo de conta pode ficar incorreta;
- o utilizador pode ficar preso num estado inconsistente.

Passos em falta:

1. Corrigir `PATCH /api/users/me` para suportar os campos realmente usados no onboarding.
2. Validar payload com schema explícito.
3. Atualizar DB com `updatedAt` quando aplicável.
4. Cobrir o fluxo com teste de integração.

### 4.3 Divergência entre schema runtime e schema de migrations

Estado atual:

- runtime consome `packages/db/src/schema.ts`
- drizzle migrations apontam para `packages/db/src/schema/index.ts`

Impacto:

- risco de build/deploy aparentemente “ok”, mas com queries e migrations desalinhadas;
- risco maior em evolução de dados, produção e debugging.

Passos em falta:

1. Escolher uma única fonte de verdade para o schema.
2. Migrar o código consumidor para essa fonte.
3. Regenerar migrations coerentes.
4. Auditar diferenças de tipos, chaves primárias e colunas de localização.
5. Executar verificação de compatibilidade entre dados existentes e schema final.

### 4.4 Serviços dedicados ainda não suportam a carga funcional prometida

Estado atual:

- `services/api`: health endpoint apenas
- `services/realtime`: echo WebSocket mínimo
- `services/workers`: log de arranque apenas

Impacto:

- o web app continua a carregar responsabilidades de frontend, API, webhooks e orchestration;
- não há runtime separado para jobs, moderação, reconciliação, notificações ou workflows pesados.

Passos em falta:

1. Decidir se o lançamento inicial usa o web app como BFF definitivo temporário ou se haverá extração pré-lançamento.
2. No mínimo, implementar workers reais para tarefas assíncronas críticas.
3. Definir backlog de extração de realtime e background jobs.

## 5. Auditoria Web

## Estado atual da Web

Pontos positivos:

- `next build` passa.
- há superfícies reais para onboarding, feed, matches, mensagens, eventos, verificação, pricing e marketplace.
- Stripe, Clerk, Ably, object storage e push já estão ligados em código.

Conclusão:

- a web é a plataforma mais avançada e a única que se aproxima de um produto utilizável.

## Gaps a resolver para a web ficar totalmente funcional

### 5.1 Fechar o onboarding real

Prioridade: crítica

Falta:

1. Corrigir persistência do onboarding no backend.
2. Garantir que utilizadores recém-criados conseguem chegar ao feed sem inconsistências.
3. Confirmar fluxos específicos por tipo de conta.

### 5.2 Completar o fluxo `SWING_CLUB`

Estado atual:

- `/{locale}/club-setup` é placeholder “Em breve”.

Falta:

1. UI e API para criar/editar clube.
2. Workflow de setup inicial do clube.
3. Gestão de eventos do clube.
4. Vista de reservas recebidas pelo host.
5. Fluxo de aceitação/recusa e gestão operacional do venue.

Sem isto, o tipo de conta `SWING_CLUB` não está funcional end-to-end.

### 5.3 Completar a verificação além do nível foto

Estado atual:

- verificação por foto existe;
- vídeo e social aparecem como “Em breve”.

Falta:

1. Decidir se vídeo/social são obrigatórios para o primeiro lançamento.
2. Se forem obrigatórios: implementar upload/submissão/revisão desses níveis.
3. Se não forem: remover claims de produto que prometem esses níveis imediatamente.

### 5.4 Consolidar o marketplace seller -> catálogo -> compra

Estado atual:

- seller onboarding Stripe Connect existe;
- criação de produtos existe;
- orders e checkout existem;
- storefront público existe.

Falta:

1. Moderação de catálogo realmente operacional.
2. Gestão de stock mais robusta e concorrente.
3. Fluxo pós-compra: fulfillment, tracking, cancelamentos, reembolsos.
4. UI para seller gerir encomendas e estado operacional.
5. Processo de payouts/reconciliação.

Sem isto, o marketplace está funcional de forma parcial, mas não pronto para operação real.

### 5.5 Completar a área de dashboard/utilizador

Estado atual:

- `/{locale}/dashboard` ainda diz explicitamente “Em construção”.

Falta:

1. Home autenticada coerente com o estado do utilizador.
2. Atalhos reais para fluxo principal.
3. Gestão clara de onboarding incompleto, verificação, subscription e notificações.

### 5.6 Corrigir assets e push web

Estado atual:

- service worker e notificações referenciam `/icons/pineapple-192.png` e `/icons/pineapple-72.png`.
- `apps/web/public/icons/` não existe.

Impacto:

- push notifications web podem aparecer sem ícones corretos ou quebrar experiência visual.

Falta:

1. Adicionar ícones efetivos em `public/icons`.
2. Validar manifest, badge e notification icons em browsers reais.
3. Testar subscription/unsubscription e delivery real.

### 5.7 Tornar a moderação/admin realmente operacional

Estado atual:

- existem admin routes e páginas no `apps/web`;
- `apps/admin` separado é placeholder.

Falta:

1. Confirmar que todas as filas admin necessárias existem de forma usável.
2. Garantir RBAC real e auditável.
3. Adicionar ferramentas operacionais mínimas para suporte e trust & safety.

### 5.8 Fechar compliance/legal para uma plataforma adults-only

Estado atual:

- há páginas legais na web, mas `docs/legal` ainda contém placeholders;
- CSAM scanner é placeholder;
- trata-se de uma plataforma para adultos, com marketplace e moderação.

Falta:

1. Finalizar Terms, Privacy, Cookies, Seller Terms e Acceptable Use juridicamente.
2. Validar consentimentos e retenção de dados.
3. Integrar solução real de CSAM scanning/reporting antes de produção pública.
4. Rever RGPD, PSD2, marketplace compliance e age-gating operacional.

## Resultado esperado para considerar a web “totalmente funcional”

Critério mínimo:

1. Novo utilizador consegue criar conta, fazer onboarding, completar perfil, fazer quiz e entrar no feed.
2. Pode fazer like/pass, gerar mutual match, abrir thread e trocar mensagens com comportamento correto.
3. Pode reservar eventos e ver atualização de estado.
4. Pode carregar fotos com moderação e verificação operacionais.
5. Um seller consegue ligar Stripe, publicar produtos aprovados e receber compras válidas.
6. Admin consegue moderar fotos, reports e verificações.
7. Webhooks Clerk e Stripe estão estáveis.
8. Legal e trust & safety estão prontos para exposição pública.

## 6. Auditoria Android / iOS

## Estado atual do Mobile

Pontos positivos:

- existe navegação base com Expo Router;
- há auth guard com Clerk;
- existem ecrãs para sign-in, feed, matches, eventos, shop, perfil, mensagens e detalhe de evento;
- há configuração de bundle/package IDs em `app.json`.

Conclusão:

- a app mobile já demonstra intenção de produto, mas ainda não está pronta para release em Android ou iOS.

## Blockers técnicos imediatos no mobile

### 6.1 O mobile não passa typecheck

Estado atual:

- `pnpm --filter the-playroom-mobile typecheck` falha.

Erros encontrados:

- uso incorreto de `useSignIn()` em `app/(auth)/sign-in.tsx`
- tipo errado para `color` em `app/(tabs)/_layout.tsx`

Passos em falta:

1. Corrigir a integração atual com `@clerk/expo` conforme a API real do SDK.
2. Corrigir tipagem de `tabBarIcon`.
3. Garantir typecheck limpo antes de qualquer tentativa de release build.

### 6.2 O bridge de autenticação mobile -> API está, no mínimo, incompleto

Estado atual:

- mobile envia `Authorization: Bearer <token>`.
- API web usa `auth()` de `@clerk/nextjs/server` em praticamente todas as rotas autenticadas.
- nesta auditoria não foi encontrado código server-side que verifique explicitamente bearer tokens do Clerk emitidos pelo mobile.

Impacto:

- há forte probabilidade de as chamadas autenticadas do mobile falharem em runtime, mesmo que a UI exista.

Passos em falta:

1. Definir uma estratégia oficial de autenticação mobile para a API.
2. Implementar verificação de bearer token do Clerk no backend usado pelo mobile.
3. Alternativamente, expor uma API dedicada preparada para mobile, em vez de depender diretamente das route handlers web.
4. Testar autenticação real em dispositivo Android e iOS.

Sem resolver isto, o mobile não pode ser considerado funcional de ponta a ponta.

### 6.3 O fluxo de mensagens mobile não implementa a mesma segurança/semântica da web

Estado atual:

- no mobile, mensagens recebidas são mostradas como `[encriptado]`;
- ao enviar mensagem, o mobile envia o texto puro no campo `encryptedPayload`.

Impacto:

- comportamento inconsistente com a web;
- quebra do modelo de encriptação ponta-a-ponta;
- potencial incompatibilidade de dados com o que a web espera.

Passos em falta:

1. Portar a gestão de keypair para mobile.
2. Implementar encriptação/decifração real com libsodium compatível com a web.
3. Garantir interoperabilidade web <-> mobile para mensagens.
4. Integrar realtime de forma consistente com Ably ou outra camada definida.

### 6.4 Fluxos de erro mobile estão propositadamente silenciados

Estado atual:

- vários ecrãs mobile têm `catch { /* ignore ... for MVP */ }`.

Impacto:

- a app pode falhar silenciosamente;
- UX de suporte e debugging em produção fica muito fraca.

Passos em falta:

1. Expor erros ao utilizador de forma útil.
2. Registar erros em observability/crash reporting.
3. Distinguir empty states de falhas reais de rede/auth/backend.

## Gaps funcionais do mobile

### 6.5 Falta cobertura de fluxos essenciais de conta

Estado atual:

- existe sign-in;
- não há sinal claro de sign-up nativo equivalente;
- não há onboarding completo mobile;
- não há editor de perfil real;
- as opções do perfil não parecem navegar para fluxos implementados.

Passos em falta:

1. Implementar sign-up mobile.
2. Implementar onboarding mobile end-to-end.
3. Implementar edição real de perfil/fotos/interesses.
4. Ligar opções de verificação, pricing e kink test a ecrãs reais.

### 6.6 Feed/matches/eventos/shop existem, mas ainda em nível MVP

Estado atual:

- feed, matches, eventos e shop carregam dados;
- UX e handling de estados ainda é básico.

Passos em falta:

1. Melhorar estados de loading/erro/empty state.
2. Implementar paginação e refresh adequados.
3. Garantir navegação consistente entre feed, match, thread e perfil.
4. Adicionar detalhe de produto, checkout e pedidos reais se o marketplace mobile fizer parte do scope de launch.

### 6.7 Checkout e pagamentos mobile não estão fechados

Estado atual:

- não há evidência de fluxo mobile completo para subscription e marketplace checkout equivalente ao web.

Passos em falta:

1. Decidir estratégia mobile de pagamentos:
   - web checkout via browser externo
   - in-app browser
   - fluxo compatível com políticas Apple/Google e Stripe
2. Implementar retorno/redirect seguro para a app.
3. Testar pós-pagamento em Android e iOS.

### 6.8 Notificações mobile ainda não estão operacionalizadas

Estado atual:

- `expo-notifications` existe como dependência;
- não foi encontrada, nesta auditoria, uma implementação fechada equivalente ao web push para mobile.

Passos em falta:

1. Registar device tokens de Android/iOS.
2. Criar backend/worker para envio de push mobile.
3. Implementar handling de deep links ao abrir notificação.
4. Testar foreground/background/terminated state.

## Gaps de packaging / stores

### 6.9 Assets de publicação mobile estão incompletos

Estado atual:

- `README-icons.md` indica explicitamente que ícones/splash devem ser substituídos antes de app store submission.
- `app.json` referencia `adaptive-icon.png` e `splash.png`, mas nesta auditoria só foi encontrado `icon.png` em `assets/`.

Impacto:

- builds de produção podem falhar ou sair com branding placeholder/incompleto.

Passos em falta:

1. Adicionar `adaptive-icon.png`.
2. Adicionar `splash.png`.
3. Validar ícones iOS/Android e splash em builds reais.
4. Rever branding final antes de store submission.

### 6.10 Prontidão de publicação Android/iOS precisa de endurecimento

Passos em falta:

1. Confirmar permissões mínimas em Android/iOS.
2. Rever privacy manifests / disclosure requirements das stores.
3. Garantir screenshots, metadata e classificação etária adequadas.
4. Definir estratégia de deep linking e universal links/app links.
5. Testar fluxo completo em dispositivos físicos.

## Resultado esperado para considerar Android e iOS “totalmente funcionais”

Critério mínimo:

1. App passa typecheck e build de produção.
2. Autenticação mobile funciona realmente contra a API.
3. Utilizador consegue sign-up/sign-in/onboarding completo.
4. Feed, matches, mensagens, eventos e perfil funcionam com dados reais.
5. Mensagens mobile respeitam o mesmo modelo de encriptação da web.
6. Notificações push mobile funcionam.
7. Assets, branding e configurações de store estão fechados.
8. Fluxos de pagamento definidos e testados para Android/iOS.

## 7. Dependências Operacionais Obrigatórias Antes de Produção

Estas tarefas não pertencem só a uma plataforma, mas são necessárias para considerar a aplicação “totalmente funcional” no mundo real.

### 7.1 CSAM e moderação real

Falta:

1. Integrar fornecedor real de CSAM scanning.
2. Definir procedimentos de escalonamento/reporting.
3. Garantir moderação humana operacional.

### 7.2 Observabilidade e suporte

Falta:

1. Error tracking estruturado.
2. Logging operacional para APIs e workers.
3. Dashboards de saúde e alertas.
4. Procedimentos de suporte para contas, pagamentos, reports e verificação.

### 7.3 Segurança e hardening

Falta:

1. Rever gestão de segredos e env vars.
2. Rever autenticação cross-platform.
3. Rever controle de acesso admin.
4. Rever storage permissions e lifecycle de media.
5. Auditar fluxos de pagamentos, reservas e dados pessoais.

### 7.4 Legal/compliance

Falta:

1. Finalizar termos e políticas.
2. Garantir consentimentos persistidos e auditáveis.
3. Rever retenção/remoção de dados e account deletion.
4. Fechar requisitos para plataforma adulta e marketplace.

## 8. Ordem Recomendada de Execução

Para chegar mais depressa a um estado realmente funcional, a sequência recomendada é esta.

### Fase 1 - Fechar bloqueios estruturais

1. Corrigir sync Clerk -> DB.
2. Corrigir persistência real do onboarding.
3. Resolver dual schema de DB.
4. Fechar estratégia de autenticação mobile para a API.

### Fase 2 - Tornar a web operacionalmente lançável

1. Completar `SWING_CLUB` setup.
2. Consolidar marketplace seller/order operations.
3. Corrigir assets push e validar notificações.
4. Tornar admin/moderação utilizáveis.
5. Fechar compliance mínima e CSAM real.

### Fase 3 - Tornar mobile realmente funcional

1. Corrigir typecheck mobile.
2. Implementar auth mobile end-to-end com backend compatível.
3. Portar onboarding e perfil completos.
4. Implementar encriptação real nas mensagens.
5. Fechar pagamentos e push mobile.
6. Fechar assets e packaging de stores.

### Fase 4 - Validação final de lançamento

1. Testes E2E por persona:
   - user social
   - couple
   - swing club
   - sex shop
   - admin/moderator
2. Testes em web desktop/mobile browser.
3. Testes físicos Android.
4. Testes físicos iPhone.
5. Dry run de suporte, reports, refunds e moderation.

## 9. Veredito Final

Se a pergunta é “o que falta para a app ficar totalmente funcional em web/android/iOS?”, a resposta curta é:

- `web`: falta fechar onboarding real, fluxo de clube, operações de marketplace/admin e readiness de trust & safety/compliance.
- `android` / `ios`: falta primeiro tornar a app tecnicamente consistente com a API e com o modelo de autenticação, depois completar mensagens seguras, onboarding, pagamentos, push e packaging.

Estado realista atual:

- web: perto de beta funcional, mas ainda não pronta para produção pública plena.
- android/ios: ainda em fase pré-beta, com blockers técnicos e de produto a resolver.