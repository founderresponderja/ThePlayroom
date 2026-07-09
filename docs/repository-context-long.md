# The Playroom - Contexto Técnico Longo

Data de geração: 2026-07-07

## 1. Resumo Executivo

The Playroom é um monorepo TypeScript com ambição multiplataforma para uma plataforma adults-only de lifestyle/CNM. O sistema junta social discovery, matching, messaging privado, eventos/clubes e marketplace para sex shops. Embora a arquitetura alvo inclua web, mobile, admin, API dedicada, realtime e workers, a implementação efetiva hoje está concentrada no `apps/web`, que opera como frontend e backend-for-frontend ao mesmo tempo.

Há um nível de sofisticação relevante em privacidade, monetização e trust & safety, mas também há debt estrutural importante, sobretudo no pacote `db`, onde coexistem dois schemas divergentes.

## 2. Visão Geral e Domínio

### Propósito principal

O produto serve uma comunidade de adultos interessada em CNM/lifestyle, com foco em:

- criação de perfis por tipo de conta;
- descoberta e matching baseado em interesses e limites;
- mensagens privadas com payload encriptado;
- eventos e venues com controlo de acesso;
- marketplace curado com sellers verificados.

### Taxonomia de contas

O código reconhece explicitamente estes tipos:

- `FEMALE_SINGLE`
- `MALE_SINGLE`
- `COUPLE_MF`
- `COUPLE_MM`
- `COUPLE_FF`
- `SWING_CLUB`
- `SEX_SHOP`

Isto não é apenas nomenclatura visual: várias rotas e capacidades mudam de acordo com este tipo.

### Lógica de negócio central

#### Onboarding e segmentação

O onboarding escolhe tipo de conta, confirma maioridade, recolhe display name e localização aproximada. No fim, o utilizador é redirecionado para um fluxo específico:

- singles/casais -> kink test
- swing club -> setup do clube
- sex shop -> setup da loja

#### Matching baseado em tags

O sistema usa `quizResults.derivedTags` e um algoritmo simples mas explícito:

- tags normais contam para afinidade;
- tags `no:*` representam limites rígidos;
- tags `curious:*` representam interesse mais fraco.

Antes de calcular score, elimina-se incompatibilidade direta entre desejos de um lado e hard limits do outro. Para utilizadores VIP, os candidatos são reordenados por score; para free users, o feed é aleatório e limitado.

#### Messaging privado

O servidor persiste `encrypted_payload` sem conhecer plaintext. O browser gera/parqueia keypair com libsodium. A chave pública é guardada em `users.publicKey`, e a privada permanece client-side.

#### Eventos e reservas

Há suporte para eventos criados por utilizadores ou clubes. A localização exata é escondida à leitura pública e revelada quando a reserva é aceite. O sistema já modela capacidade, waitlist e prioridade VIP.

#### Marketplace

O marketplace trata sellers como contas `SEX_SHOP`, com onboarding Stripe Connect, catálogo moderado, encomendas e fees de plataforma.

#### Trust & Safety

O domínio já prevê:

- verificações de identidade/idade;
- moderação de fotos;
- reporting;
- auditoria;
- CSAM scanning placeholder com fail-safe em produção.

## 3. Tech Stack

### Stack raiz

- `pnpm`
- `Turborepo`
- `TypeScript`
- `ESLint`
- `Prettier`
- `Vitest`

### Web

- `Next.js 14.2.5`
- `React 18.3.1`
- `Tailwind CSS`
- `next-intl`
- `@clerk/nextjs`
- `stripe` + `@stripe/stripe-js`
- `ably`
- `libsodium-wrappers`
- `web-push`
- AWS SDK S3 / presigner
- Google Maps JS loader

### Mobile

- `Expo`
- `expo-router`
- `React Native`
- `@clerk/expo`
- `expo-secure-store`
- `expo-notifications`

### Backend/dados

- `Node.js`
- `Express` no serviço API stub
- `ws` no serviço realtime stub
- `Postgres`
- `Drizzle ORM`
- `drizzle-kit`
- `postgres`
- `zod`

### Integrações externas

- Clerk
- Stripe Billing
- Stripe Connect
- Ably
- Google Maps
- S3/R2 compatible storage
- Svix webhook verification
- Make.com webhook operacional

## 4. Arquitetura do Projeto

### Forma arquitetural atual

Hoje, a arquitetura real é:

- monorepo por apps/packages/services;
- web app Next.js como superfície dominante;
- backend-for-frontend dentro do App Router;
- packages partilhados para DB, tokens e config;
- serviços separados ainda essencialmente placeholders.

### Interpretação prática

Se outro LLM tiver de alterar o projeto, deve assumir que:

- a lógica crítica vive em `apps/web/src/app/api/*` e `apps/web/src/lib/*`;
- `packages/core` ainda não é um kernel funcional robusto;
- `services/api`, `services/realtime` e `services/workers` são intenções arquiteturais futuras, não a implementação corrente.

### Patterns evidentes

- backend-for-frontend
- monorepo modular
- feature gating via flags e entitlements
- webhook-driven sync
- client-side cryptography
- App Router organizado por feature

### Debt estrutural principal

O pacote `packages/db` tem duas superfícies de schema:

- `packages/db/src/schema.ts`: usada em runtime via `packages/db/src/index.ts`
- `packages/db/src/schema/index.ts`: usada por `drizzle.config.ts` para migrations

As diferenças incluem:

- `serial/integer` vs `uuid`
- shape diferente de colunas de localização
- presença/ausência de certas colunas e timestamps
- enum types dedicados num schema e strings simples no outro

Este é o risco mais relevante do repositório para qualquer evolução de dados.

## 5. Estrutura de Diretórios

```text
.
├── apps/
│   ├── admin/          # dashboard admin em Next.js, ainda inicial
│   ├── mobile/         # Expo app com auth guard e placeholders funcionais
│   └── web/            # principal aplicação implementada, incluindo API routes
├── docs/
│   ├── decisions/      # ADRs
│   └── legal/          # documentos legais placeholder
├── packages/
│   ├── config/         # env schema e config partilhada
│   ├── core/           # domínio partilhado mínimo
│   ├── db/             # schema e bootstrap Drizzle/Postgres
│   └── ui/             # tokens visuais
├── services/
│   ├── api/            # Express stub
│   ├── realtime/       # WS stub
│   └── workers/        # worker stub
├── .github/workflows/  # CI e deploy
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

## 6. Componentes Principais

### Web shell

- `apps/web/src/app/[locale]/layout.tsx`
- `apps/web/src/app/[locale]/page.tsx`
- `apps/web/middleware.ts`

Estes ficheiros definem locale routing, auth provider, theme bootstrap, age gate e posicionamento do produto.

### Lógica crítica de produto

- `apps/web/src/app/api/feed/route.ts`
- `apps/web/src/lib/matching.ts`
- `apps/web/src/lib/entitlements.ts`
- `apps/web/src/lib/crypto.ts`
- `apps/web/src/lib/csam.ts`
- `apps/web/src/app/api/webhooks/stripe/route.ts`

### Dados

- `packages/db/src/index.ts`
- `packages/db/src/schema.ts`
- `packages/db/src/schema/index.ts`

### Mobile

- `apps/mobile/app/_layout.tsx`
- `apps/mobile/src/lib/api.ts`

### Serviços futuros

- `services/api/src/index.ts`
- `services/realtime/src/index.ts`
- `services/workers/src/index.ts`

## 7. Estado Atual / Convenções

### TypeScript e disciplina estática

`tsconfig.base.json` está em modo estrito com:

- `strict`
- `noUncheckedIndexedAccess`
- `noImplicitAny`
- `noImplicitReturns`

### Formatação

- indentação de 2 espaços
- `singleQuote: true`
- `trailingComma: all`
- `semi: true`

### Regras ESLint

- return types explícitos em TS
- `no-explicit-any` como erro
- `no-unused-vars` estrito
- `no-console` warning com allowlist pequena

### Convenções de naming

- account types em `SCREAMING_SNAKE_CASE`
- features em `snake_case`
- colunas SQL em `snake_case`
- componentes React em `PascalCase`

### i18n

- locales: `pt`, `en`, `es`
- locale default: `pt`
- locale prefix sempre presente na URL

### Visual system

Dark theme forte com preto, vermelho e fúcsia. `packages/ui/src/tokens.ts` é a fonte principal dos tokens.

### CI/CD

CI executa `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test`.

Deploy faz build e depois:

- deploy Vercel
- EAS build para mobile

## 8. Mapa Detalhado de API

Este apêndice descreve a superfície de API efetiva do `apps/web/src/app/api`. Os contratos abaixo são inferidos do código atual, não de documentação externa. Quando o handler não valida fortemente o payload, isso é assinalado.

### Convenções transversais dos handlers

- A maioria das rotas autenticadas usa `auth()` do Clerk e depois resolve o utilizador interno por `users.clerkUserId`.
- Muitos handlers retornam `401` se não houver sessão e `404` se o utilizador autenticado ainda não existir na base de dados.
- Em várias rotas há mistura de Drizzle query builder com SQL raw via `(db as any).execute(sql...)`.
- Quase todos os retornos são JSON; webhooks devolvem `Response` simples.

## 8.1 Feed, matching e messaging

### `GET /api/feed`

Objetivo:

- devolver candidatos ao feed do utilizador autenticado.

Auth:

- obrigatório.

Pré-condições:

- utilizador tem de existir;
- `onboardingComplete` tem de estar a `true`;
- utilizadores não VIP estão sujeitos a limite diário de 5 matches criados.

Input:

- sem body.

Processamento:

- encontra matches já vistos para excluir;
- seleciona até 10 candidatos onboarded;
- junta fotos públicas;
- se o utilizador for VIP, junta tags do quiz e reordena por compatibilidade.

Resposta de sucesso:

- array de candidatos com campos base do utilizador, perfil, fotos, `compatibilityScore` e `sharedTags`.

Erros relevantes:

- `401` unauthorized
- `404` user not found
- `403` onboarding required
- `429` limite diário de matches atingido

### `POST /api/feed/action`

Objetivo:

- registar ação de `like` ou `pass` sobre outro utilizador.

Auth:

- obrigatório.

Body esperado:

```json
{
  "targetUserId": 123,
  "action": "like"
}
```

Validação:

- `targetUserId` truthy
- `action` em `like | pass`

Efeitos:

- insere row em `matches`
- `status = pending` para `like`
- `status = rejected` para `pass`
- se existir like pendente recíproco, promove ambos para `matched` e envia notificação

Resposta:

```json
{
  "success": true,
  "isMutualMatch": true
}
```

### `GET /api/matches`

Objetivo:

- listar matches mútuos do utilizador autenticado.

Resposta:

- array com `matchId`, `matchedAt` e snapshot do outro utilizador, incluindo foto principal pública.

### `GET /api/compatibility/[userId]`

Objetivo:

- calcular compatibilidade entre o utilizador autenticado e outro utilizador.

Auth:

- obrigatório e restrito a VIP.

Path params:

- `userId` numérico.

Resposta de sucesso:

```json
{
  "score": 42,
  "sharedTags": ["voyeur", "soft-swap"],
  "incompatible": false
}
```

Caso especial:

- se faltar quiz num dos lados: `{ "score": null, "reason": "Quiz results missing" }`

Erros:

- `403` VIP required
- `404` current user ou target user inexistente

### `POST /api/threads`

Objetivo:

- obter ou criar thread 1:1 entre utilizadores com mutual match.

Body esperado:

```json
{
  "otherUserId": 456
}
```

Regras:

- só cria se existir `matches.status = matched` em qualquer direção entre os dois utilizadores.
- se a thread já existir, devolve a existente.

Erros:

- `403` se não houver mutual match

### `GET /api/messages?threadId=...`

Objetivo:

- listar mensagens de uma thread.

Query params:

- `threadId` obrigatório e numérico.

Regras:

- utilizador autenticado tem de pertencer à thread.
- devolve até 50 mensagens ordenadas por `createdAt` ascendente.

### `POST /api/messages`

Objetivo:

- persistir mensagem encriptada.

Body esperado:

```json
{
  "threadId": 7,
  "encryptedPayload": "BASE64_PAYLOAD"
}
```

Regras:

- thread tem de existir;
- remetente tem de ser participante.

Resposta:

- mensagem inserida.

### `GET /api/ably-token`

Objetivo:

- emitir token request Ably para o utilizador autenticado.

Capabilities emitidas:

- `user:{userId}:notifications`: subscribe
- `thread:*`: publish, subscribe, presence

Resposta:

- objeto de token request Ably.

## 8.2 Utilizador, perfil, onboarding e chaves

### `GET /api/users/me`

Objetivo:

- devolver row inteira de `users` para o utilizador autenticado.

Observação:

- usa SQL raw `select *`, logo a shape devolvida é a shape real da tabela runtime.

### `PATCH /api/users/me`

Objetivo:

- atualizar o display name do utilizador.

Body efetivamente usado:

```json
{
  "displayName": "Novo nome"
}
```

Observação crítica:

- apesar do onboarding enviar outros campos (`accountType`, `ageVerifiedAt`, `onboardingComplete`, `dateOfBirth`), este handler atual só atualiza `display_name`.
- isto é importante porque cria um gap entre a intenção do UI e o comportamento real da API.

### `PATCH /api/profile`

Objetivo:

- criar ou atualizar o perfil público do utilizador.

Body esperado:

```json
{
  "bio": "...",
  "interests": ["voyeur", "soft-swap"]
}
```

Comportamento:

- se já existir `profiles` para o user, faz update de `bio` e `interests`;
- caso contrário, cria row nova.

### `POST /api/quiz`

Objetivo:

- persistir respostas do kink test e derivar tags/archetype.

Body esperado:

```json
{
  "answers": {
    "voyeur": { "rating": "yes" },
    "group-play": { "rating": "maybe" }
  },
  "accountTypeAtTime": "FEMALE_SINGLE"
}
```

Derivações:

- `yes` -> tag normal
- `maybe` -> `curious:{key}`
- archetype baseado na proporção de respostas `yes`

Resposta:

```json
{
  "derivedTags": ["voyeur", "curious:group-play"],
  "archetype": "The Explorer"
}
```

### `GET /api/keypair`

Objetivo:

- ler `publicKey` do utilizador autenticado.

Resposta:

```json
{ "publicKey": "..." }
```

### `POST /api/keypair`

Objetivo:

- guardar chave pública do utilizador.

Body esperado:

```json
{ "publicKey": "BASE64_PUBLIC_KEY" }
```

Efeito:

- atualiza `users.publicKey` e `updatedAt`.

## 8.3 Fotos, moderação e verificação

### `GET /api/photos`

Objetivo:

- listar fotos do próprio utilizador.

Resposta:

- array de rows de `photos`, ordenadas por `createdAt desc`.

### `POST /api/photos`

Objetivo:

- gravar registo de foto após upload direto para storage.

Body esperado:

```json
{
  "key": "photos/clerk_user/uuid.webp",
  "isPrivate": true,
  "isPrimary": false
}
```

Regras:

- máximo de 10 fotos por utilizador;
- se `isPrimary = true`, despromove as restantes;
- primeira foto torna-se primária por defeito.

Observação:

- este handler não corre CSAM; apenas cria a row com `csamScanStatus: pending`.

### `DELETE /api/photos`

Objetivo:

- apagar foto do utilizador e respetivo objeto no storage.

Body esperado:

```json
{ "photoId": 10 }
```

### `PATCH /api/photos/[id]`

Objetivo:

- atualizar flags de uma foto.

Body esperado:

```json
{
  "isPrimary": true,
  "isPrivate": false
}
```

Regras:

- foto tem de pertencer ao utilizador autenticado;
- se `isPrimary` for `true`, despromove as restantes.

### `POST /api/photos/upload-url`

Objetivo:

- emitir presigned upload URL para fotos normais.

Body esperado:

```json
{
  "contentType": "image/webp",
  "sizeMb": 4.2
}
```

Validação:

- tipos permitidos: jpeg, png, webp
- tamanho máximo: 10 MB

Resposta:

```json
{
  "uploadUrl": "https://...",
  "key": "photos/..."
}
```

### `POST /api/photos/confirm`

Objetivo:

- confirmar foto já subida, buscar binário, correr CSAM scan e só depois persistir row.

Body esperado:

```json
{
  "key": "photos/...",
  "isPrivate": false,
  "isPrimary": true
}
```

Fluxo:

- resolve URL pública do objeto;
- faz fetch da imagem;
- corre `scanImageForCSAM`;
- se unsafe, apaga o objeto, chama `reportCSAM` e devolve `451`;
- valida limite de 10 fotos;
- grava foto com `moderationStatus: pending` e `csamScanStatus: clean`.

Observação:

- coexistem dois fluxos de criação de fotos: `/api/photos` e `/api/photos/confirm`. Outro LLM deve tratá-los com cuidado porque representam duas estratégias distintas de persistência.

### `GET /api/verifications`

Objetivo:

- listar verificações do utilizador autenticado.

Resposta:

- array de rows de `verifications` com aliases camelCase produzidos em SQL raw.

### `POST /api/verifications`

Objetivo:

- criar pedido de verificação.

Body esperado:

```json
{
  "type": "photo",
  "evidenceRef": "verifications/..."
}
```

Validação:

- `type` em `photo | video | social`
- bloqueia criação se o último estado já estiver `approved`

### `POST /api/verifications/photo-upload`

Objetivo:

- emitir presigned upload URL para imagens de verificação.

Body esperado:

```json
{ "contentType": "image/jpeg" }
```

Validação:

- jpeg/png/webp apenas.

## 8.4 Eventos, clubes e reservas

### `GET /api/events`

Objetivo:

- listar próximos eventos.

Comportamento:

- filtra `startsAt >= now`;
- ordena ascendente;
- limita a 20.

### `POST /api/events`

Objetivo:

- criar evento.

Body esperado:

```json
{
  "title": "Lisbon Sunset Party",
  "description": "...",
  "startsAt": "2026-08-12T19:00:00.000Z",
  "endsAt": "2026-08-12T23:00:00.000Z",
  "locationMode": "custom",
  "clubId": 1,
  "customLat": 38.72,
  "customLng": -9.13,
  "customAddress": "Lisboa",
  "capacity": 40,
  "privacy": "public",
  "ticketed": true,
  "priceCents": 2500
}
```

Regras:

- requer auth
- `title` e `startsAt` obrigatórios
- `creatorType` é inferido do tipo de conta do utilizador (`club` ou `user`)
- localização custom é embalada em `customLocation` jsonb

### `GET /api/events/[id]`

Objetivo:

- ler detalhe de evento por ID.

Privacidade:

- devolve o evento, mas força `customLocation: null` para esconder coordenadas exatas.

### `GET /api/clubs`

Objetivo:

- listar clubes verificados.

### `POST /api/clubs`

Objetivo:

- criar clube.

Auth e regras:

- requer utilizador interno
- só `SWING_CLUB` pode criar

Body esperado:

```json
{
  "name": "Club X",
  "description": "...",
  "address": "...",
  "lat": 38.7,
  "lng": -9.1,
  "amenities": ["bar", "private rooms"]
}
```

Resposta:

- row do clube criado com `verified: false`.

### `GET /api/clubs/[id]`

Objetivo:

- ler detalhe de clube.

Privacidade:

- fuzz das coordenadas para 1 decimal antes de devolver.

### `GET /api/reservations`

Objetivo:

- listar reservas do utilizador autenticado.

### `POST /api/reservations`

Objetivo:

- criar reserva para evento.

Body esperado:

```json
{ "eventId": 12 }
```

Regras:

- valida existência do evento;
- se capacidade estiver esgotada, cria reserva com `status: waitlist`;
- define `priorityScore = 100` para utilizador VIP, senão `0`;
- bloqueia duplicados com `409`.

### `POST /api/reservations/[id]/accept`

Objetivo:

- aceitar reserva como criador do evento.

Regras:

- só o `creatorId` do evento pode aceitar;
- atualiza `status: accepted` e `locationRevealedAt`;
- notifica o utilizador reservado.

## 8.5 Subscription, billing e marketplace

### `GET /api/subscription`

Objetivo:

- devolver estado de subscrição do utilizador.

Resposta:

```json
{
  "isVip": true,
  "plan": "price_...",
  "status": "active",
  "currentPeriodEnd": "2026-08-01T00:00:00.000Z",
  "accountType": "FEMALE_SINGLE"
}
```

### `POST /api/stripe/checkout`

Objetivo:

- criar checkout session Stripe para subscrição VIP.

Body esperado:

```json
{ "interval": "monthly" }
```

Regras:

- preço é inferido a partir de `PRICE_MAP` e `user.accountType`
- reutiliza `stripeCustomerId` existente ou cria customer novo
- devolve URL de checkout

### `POST /api/stripe/portal`

Objetivo:

- criar billing portal session.

Pré-condição:

- utilizador tem `stripeCustomerId` em `subscriptions`.

### `GET /api/products`

Objetivo:

- listar produtos públicos aprovados.

Filtro:

- `active = true`
- `moderationStatus = approved`

### `POST /api/products`

Objetivo:

- criar produto como seller.

Regras:

- só `SEX_SHOP`
- shop do utilizador tem de existir
- `payoutsEnabled` tem de ser `true`

Body esperado:

```json
{
  "title": "Produto",
  "description": "...",
  "priceCents": 1999,
  "category": "toys",
  "stock": 20,
  "images": ["https://..."]
}
```

Comportamento:

- cria com `moderationStatus: pending` e `active: false`

### `GET /api/products/[id]`

Objetivo:

- ler produto por ID.

### `PATCH /api/products/[id]`

Objetivo:

- atualizar produto do próprio shop.

Campos aceites:

- `title`
- `description`
- `priceCents`
- `category`
- `stock`
- `active`

### `DELETE /api/products/[id]`

Objetivo:

- soft-disable do produto.

Comportamento:

- faz update `active: false`.

### `GET /api/orders`

Objetivo:

- listar encomendas do buyer autenticado.

Resposta:

- orders com `items` enriquecidos com `productTitle`.

### `POST /api/orders`

Objetivo:

- criar order e PaymentIntent para compra direta de um produto.

Body esperado:

```json
{
  "productId": 9,
  "qty": 2
}
```

Regras:

- produto tem de estar ativo e aprovado;
- shop tem de ter `stripeConnectAccountId` e `payoutsEnabled`;
- calcula `platformFeeCents` a partir de `MARKETPLACE_DEFAULT_COMMISSION_BPS`.

Resposta:

```json
{
  "clientSecret": "pi_..._secret_...",
  "orderId": 15,
  "totalCents": 3998,
  "feeCents": 400
}
```

### `POST /api/orders/checkout-session`

Objetivo:

- criar Stripe Checkout Session para uma encomenda já criada.

Body esperado:

```json
{ "orderId": 15 }
```

Resposta:

```json
{ "url": "https://checkout.stripe.com/..." }
```

### `POST /api/connect/onboard`

Objetivo:

- iniciar onboarding Stripe Connect para seller.

Regras:

- só `SEX_SHOP`
- cria ou reutiliza `shops` row
- cria ou reutiliza `stripeConnectAccountId`
- devolve link de onboarding Stripe Express

### `GET /api/connect/status`

Objetivo:

- ler estado da conta Connect do seller.

Comportamento:

- se necessário, sincroniza `payoutsEnabled` e `status` na tabela `shops`.

Resposta:

```json
{
  "connected": true,
  "payoutsEnabled": true,
  "chargesEnabled": true,
  "shop": {
    "id": 1,
    "name": "Minha Loja",
    "status": "active",
    "verified": false
  }
}
```

### `POST /api/connect/dashboard`

Objetivo:

- criar login link para Stripe Express dashboard do seller.

## 8.6 Push, notificações e realtime auxiliar

### `POST /api/push/subscribe`

Objetivo:

- guardar ou atualizar web push subscription.

Body esperado:

```json
{
  "endpoint": "https://push.service/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

### `DELETE /api/push/subscribe`

Objetivo:

- apagar subscription por `endpoint`.

Body esperado:

```json
{ "endpoint": "https://push.service/..." }
```

Observação:

- o handler não verifica ownership da subscription pelo `userId`; apaga apenas por endpoint.

## 8.7 Admin e Trust & Safety

Todas estas rotas dependem de `isAdmin()`.

### `GET /api/admin/verifications`

Objetivo:

- listar verificações pendentes com join a utilizadores.

Resposta:

- array de items de queue para revisão.

### `PATCH /api/admin/verifications/[id]`

Objetivo:

- aprovar ou rejeitar verificação.

Body esperado:

```json
{ "status": "approved" }
```

Efeitos:

- atualiza `verifications.status` e `reviewed_at`;
- se aprovado, faz update de `users.verification_level`.

### `PATCH /api/admin/photos/[id]`

Objetivo:

- moderar foto.

Body esperado:

```json
{ "moderationStatus": "rejected" }
```

Efeitos:

- atualiza `photos.moderation_status`;
- se rejeitada, chama `deleteObject(photo.url)`.

Observação:

- o código passa a URL inteira a `deleteObject`, o que pode não corresponder à key esperada pela camada de storage.

### `GET /api/admin/csam`

Objetivo:

- devolver métricas simples de CSAM status em fotos.

Resposta:

```json
{
  "pending": 3,
  "clean": 120,
  "flagged": 0,
  "scannerConfigured": false,
  "note": "Real CSAM scanning requires ..."
}
```

### `PATCH /api/admin/reports/[id]`

Objetivo:

- marcar report como resolvido.

Resposta:

```json
{ "ok": true, "status": "resolved" }
```

### `POST /api/admin/reports/[id]/ban`

Objetivo:

- banir o alvo de um report por soft delete.

Efeito:

- atualiza `users.deleted_at` do `targetId` do report.

### `PATCH /api/admin/users/[id]`

Objetivo:

- marcar utilizador como deleted/banido.

Body esperado:

```json
{ "deletedAt": "2026-07-07T10:00:00.000Z" }
```

Se o body não vier, usa a timestamp atual.

## 8.8 Webhooks

### `POST /api/webhooks/clerk`

Objetivo:

- validar assinatura Svix de eventos Clerk.

Estado real:

- verifica headers e assinatura;
- não sincroniza users para a base de dados;
- apenas faz log do tipo do evento.

Conclusão:

- contrato externo existe, mas o side effect de negócio ainda não foi implementado.

### `POST /api/webhooks/stripe`

Objetivo:

- processar eventos Stripe para orders e subscriptions.

Eventos tratados:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Efeitos principais:

- cria ou atualiza `subscriptions`
- marca `orders.status = paid` quando houver `orderId` em metadata
- ativa/desativa `users.isVip` e `subscriptionTier`
- cria/desativa entitlements VIP

Importante:

- o código assume campos metadata como `userId` e `orderId`.
- a atualização de entitlements procura por `entitlements.userId`, não por `feature`, o que merece atenção em cenários de múltiplas features já existentes.

## 9. Fluxos End-to-End por Feature

Esta secção descreve os percursos completos mais importantes do produto, do ponto de entrada UI até persistência e side effects.

### 9.1 Onboarding e ativação inicial

#### Objetivo do fluxo

Transformar um utilizador autenticado por Clerk num utilizador interno segmentado, com nome visível e gating inicial de idade.

#### Percurso UI

Entrada típica:

- utilizador autenticado chega a `/{locale}/onboarding`
- `OnboardingWizard` conduz 4 passos:
  - seleção do tipo de conta
  - data de nascimento
  - display name
  - permissão de localização aproximada

#### Validação client-side

- tipo de conta obrigatório
- data de nascimento obrigatória
- idade mínima de 18 anos
- display name obrigatório
- para casais, segundo nome obrigatório

#### Chamada de API

No fim, a UI faz `PATCH /api/users/me` com um payload mais ambicioso do que o handler realmente consome:

```json
{
  "accountType": "COUPLE_MF",
  "displayName": "Ana & João",
  "ageVerifiedAt": "2026-07-07T10:00:00.000Z",
  "onboardingComplete": true,
  "dateOfBirth": "1993-04-10T00:00:00.000Z"
}
```

#### Realidade atual do backend

`PATCH /api/users/me` neste momento atualiza apenas `display_name` na tabela `users`.

Consequências:

- a UI assume que o onboarding marca o utilizador como concluído;
- o handler atual não persiste `accountType`, `dateOfBirth`, `ageVerifiedAt` nem `onboardingComplete`;
- portanto existe um gap entre intenção de produto e estado backend real.

#### Navegação pós-onboarding

Após resposta com sucesso, a UI redireciona:

- singles/casais -> `/{locale}/kink-test`
- swing clubs -> `/{locale}/club-setup`
- sex shops -> `/{locale}/shop-setup`

#### Dependências de dados

- Clerk para identidade primária
- `users` para perfil interno

#### Risco arquitetural

Este é um dos fluxos mais sensíveis porque várias outras rotas dependem de `users.onboardingComplete`, mas o próprio onboarding atual não o garante no backend.

### 9.2 Kink test -> tags -> compatibilidade -> feed

#### Objetivo do fluxo

Capturar preferências, derivar tags úteis e alimentar descoberta/matching.

#### Etapa 1: submissão do quiz

UI envia `POST /api/quiz` com `answers` e `accountTypeAtTime`.

Backend:

- resolve utilizador por `clerk_user_id`
- deriva tags:
  - `rating = yes` -> tag direta
  - `rating = maybe` -> `curious:{tag}`
- deriva `archetype` pela proporção de respostas positivas
- insere row em `quizResults`

Persistência:

- tabela `quiz_results`

Resposta:

- `derivedTags`
- `archetype`

#### Etapa 2: geração do feed

Quando a UI entra no feed, `GET /api/feed`:

- autentica utilizador
- exige existência de `users` row
- exige `onboardingComplete = true`
- em utilizadores free, conta matches criados hoje e corta no limite de 5
- exclui utilizador atual e perfis já vistos
- carrega candidatos com `profiles` e fotos públicas

#### Etapa 3: ranking VIP

Se o utilizador for VIP e tiver tags derivadas:

- backend carrega o último `quizResults` dos candidatos
- invoca `rankCandidates()` de `apps/web/src/lib/matching.ts`
- remove incompatíveis
- ordena por score descendente

#### Etapa 4: ação do utilizador no feed

Ao fazer `like` ou `pass`, a UI chama `POST /api/feed/action`.

Backend:

- insere row em `matches`
- `like` cria `pending`
- `pass` cria `rejected`
- se encontrar like recíproco pendente, promove ambos para `matched`
- dispara `notifyUser()` para o outro lado

Persistência:

- tabela `matches`
- possivelmente `notifications`, dependendo da implementação de `notifyUser`

#### Resultado visível ao utilizador

- free users: feed aleatório e limitado
- VIP users: feed ordenado por compatibilidade
- mutual like -> novo match disponível em `/{locale}/matches`

### 9.3 Match -> thread -> messaging encriptada -> realtime

#### Objetivo do fluxo

Permitir comunicação privada apenas entre utilizadores com mutual match.

#### Etapa 1: lista de matches

UI `MatchesList` chama `GET /api/matches`.

Backend:

- encontra rows `matches.status = matched`
- identifica o outro utilizador em cada par
- junta foto principal pública

Output:

- lista de cartões clicáveis para `/{locale}/messages/{otherUserId}`

#### Etapa 2: preparação criptográfica

Ao abrir `MessageThread`:

- hook `useKeypair(currentClerkId)` inicializa ou recupera o keypair local
- a chave pública do utilizador deve ter sido publicada antes via `POST /api/keypair`
- a chave pública do interlocutor é passada para o componente

Se o outro utilizador não tiver `publicKey`, a conversa não avança e a UI mostra bloqueio explícito.

#### Etapa 3: criação/obtenção da thread

UI chama `POST /api/threads` com `otherUserId`.

Backend:

- confirma mutual match entre os dois utilizadores
- procura thread existente
- se não existir, cria `threads(participantAId, participantBId)`

#### Etapa 4: leitura do histórico

Com `threadId` resolvido, UI chama `GET /api/messages?threadId=...`.

Backend:

- valida que o utilizador pertence à thread
- devolve até 50 mensagens por ordem temporal

Client:

- mensagens recebidas do outro lado são decifradas via `decryptMessage`
- mensagens do próprio remetente são mostradas localmente com texto puro, porque o modelo sealed-box não permite reler facilmente o ciphertext enviado como sender

#### Etapa 5: envio de nova mensagem

UI:

- cifra o texto com `encryptMessage(text, otherPublicKey)`
- envia `POST /api/messages`

Backend:

- valida pertença à thread
- insere row com `encryptedPayload`

Persistência:

- tabela `messages`

#### Etapa 6: entrega realtime

Em paralelo, o cliente obtém token via `GET /api/ably-token` e subscreve o canal `thread:{threadId}`.

Após persistir a mensagem:

- o remetente publica a mensagem no canal Ably
- o destinatário subscrito recebe evento `message`
- o cliente destinatário decifra e injeta na UI

#### Dependências externas

- Ably para pub/sub e presence
- libsodium no browser

#### Modelo de confiança

- servidor armazena payload cifrado
- plaintext vive apenas nos clientes
- disponibilidade do fluxo depende de ambos os utilizadores terem keypairs válidos

### 9.4 Verificação do perfil e níveis de confiança

#### Objetivo do fluxo

Submeter provas de verificação e elevar `verificationLevel` do utilizador após revisão admin.

#### Etapa 1: UI de verificação

`VerificationClient` mostra:

- estado atual do nível (`none`, `photo`, `video`, `social`)
- queue local de verificações existentes
- botão de upload para verificação por foto

#### Etapa 2: upload da selfie

UI:

- pede `POST /api/verifications/photo-upload`
- recebe `{ uploadUrl, key }`
- faz `PUT` do ficheiro diretamente para storage

#### Etapa 3: criação do pedido de verificação

Depois do upload, UI chama `POST /api/verifications` com:

```json
{
  "type": "photo",
  "evidenceRef": "verifications/..."
}
```

Backend:

- resolve utilizador interno
- valida tipo
- impede duplicar se já existir verificação aprovada
- cria row com `status: pending`

Persistência:

- tabela `verifications`

#### Etapa 4: revisão admin

Admin queue usa `GET /api/admin/verifications` para listar pendentes.

Quando o admin decide:

- chama `PATCH /api/admin/verifications/[id]` com `status = approved|rejected`

Backend:

- atualiza `verifications.status`
- grava `reviewed_at`
- se `approved`, traduz `type` em `verification_level` e atualiza `users`

#### Resultado de negócio

- aumento do sinal de confiança no perfil
- potencial impacto em matching e acesso a eventos exclusivos, conforme copy do produto

### 9.5 Fotos de perfil -> storage -> CSAM/moderação

#### Objetivo do fluxo

Permitir fotos públicas/privadas com pipeline de segurança e moderação.

#### Variante A: fluxo simples `/api/photos`

1. cliente sobe ficheiro para storage por mecanismo externo
2. cliente chama `POST /api/photos` com `key`, `isPrivate`, `isPrimary`
3. backend grava row com `moderationStatus: pending` e `csamScanStatus: pending`

Este fluxo é mais simples e não valida o binário no momento do registo.

#### Variante B: fluxo confirmado `/api/photos/confirm`

1. cliente obtém presigned URL em `POST /api/photos/upload-url`
2. cliente faz upload direto do ficheiro
3. cliente chama `POST /api/photos/confirm`
4. backend:
   - lê o ficheiro pela URL pública
   - converte em `ArrayBuffer`
   - chama `scanImageForCSAM`
   - se bloqueado, apaga o objeto e reporta incidente
   - se aceite, grava row com `csamScanStatus: clean` e `moderationStatus: pending`

#### Moderação humana

Posteriormente, admin usa `PATCH /api/admin/photos/[id]` para marcar:

- `approved`
- `rejected`

Se rejeitada, tenta apagar o objeto do storage.

#### Estado visível no produto

- apenas fotos públicas e aprovadas entram no storefront público do perfil/feed;
- fotos privadas existem como capability alinhada com VIP/privacy features.

### 9.6 Eventos e reservas com revelação tardia da localização

#### Objetivo do fluxo

Criar eventos e controlar acesso/visibilidade da localização.

#### Etapa 1: criação do evento

Host autenticado chama `POST /api/events`.

Backend:

- resolve utilizador
- define `creatorType = club` se a conta for `SWING_CLUB`, senão `user`
- persiste dados principais do evento
- localização custom é guardada em `customLocation` jsonb

Persistência:

- tabela `events`

#### Etapa 2: browsing público

Páginas públicas usam:

- `GET /api/events`
- `GET /api/events/[id]`

No detalhe, o backend devolve o evento com `customLocation: null`, ocultando coordenadas exatas.

#### Etapa 3: pedido de reserva

Participante autenticado chama `POST /api/reservations` com `eventId`.

Backend:

- verifica existência do evento
- se houver capacidade e ela estiver cheia, cria `waitlist`
- caso contrário cria `requested`
- `priorityScore` depende do `isVip`

Persistência:

- tabela `reservations`

#### Etapa 4: aceitação pelo host

Host chama `POST /api/reservations/[id]/accept`.

Backend:

- valida que o `creatorId` do evento coincide com o utilizador atual
- muda `status` para `accepted`
- grava `locationRevealedAt`
- envia notificação ao participante

#### Resultado de negócio

- a localização exata só deve ser considerada revelada após aceitação;
- VIP influencia prioridade, mas não bypassa a lógica do host.

### 9.7 Seller onboarding -> catálogo -> order -> checkout

#### Objetivo do fluxo

Transformar uma conta `SEX_SHOP` num seller operacional e permitir compras com split de receita.

#### Etapa 1: onboarding Stripe Connect

Seller chama `POST /api/connect/onboard`.

Backend:

- valida tipo de conta `SEX_SHOP`
- procura ou cria `shop`
- cria ou reutiliza conta Stripe Express
- devolve `accountLink.url`

Persistência:

- tabela `shops`

#### Etapa 2: sincronização do estado do seller

UI usa `GET /api/connect/status`.

Backend:

- lê `shops`
- consulta estado real da conta Stripe
- sincroniza `payoutsEnabled` e `status`

Este passo é o gate operacional para permitir criação de produtos.

#### Etapa 3: criação do catálogo

Seller chama `POST /api/products`.

Backend exige:

- conta `SEX_SHOP`
- shop existente
- `payoutsEnabled = true`

Produtos entram como:

- `moderationStatus: pending`
- `active: false`

Logo, a criação do catálogo tem uma dependência explícita de moderação/publicação antes de aparecer na loja pública.

#### Etapa 4: storefront público

Compradores navegam via `GET /api/products`, que só devolve produtos:

- ativos
- aprovados em moderação

#### Etapa 5: criação da order

Quando o buyer inicia compra:

- chama `POST /api/orders` com `productId` e `qty`

Backend:

- valida disponibilidade do produto
- valida conta Connect do shop
- calcula `totalCents` e `platformFeeCents`
- cria `orders`
- cria `orderItems`
- cria `PaymentIntent` Stripe com `application_fee_amount` e `transfer_data.destination`
- grava `paymentIntentId` na order

#### Etapa 6: checkout UI

`CheckoutClient` chama `POST /api/orders/checkout-session` com `orderId`.

Backend:

- valida ownership da order pelo buyer
- lê items e shop
- cria Stripe Checkout Session
- devolve URL

Client:

- faz redirect browser para Stripe hosted checkout

#### Etapa 7: confirmação assíncrona

Quando Stripe envia `checkout.session.completed`:

- `POST /api/webhooks/stripe` marca `orders.status = paid` se existir `orderId` em metadata

#### Resultado de negócio

- fee da plataforma e transferência para seller são definidas logo no momento da criação do intent/session;
- a confirmação final depende do webhook, não apenas do redirect do browser.

### 9.8 Upgrade VIP -> entitlements -> capacidade adicional

#### Objetivo do fluxo

Converter utilizador free em VIP e desbloquear capacidades premium.

#### Etapa 1: escolha do plano

UI chama `POST /api/stripe/checkout` com `interval: monthly|annual`.

Backend:

- resolve `accountType`
- obtém `priceId` a partir de `PRICE_MAP`
- cria ou reutiliza Stripe customer
- cria checkout session subscription-mode

#### Etapa 2: pagamento/checkout externo

Utilizador sai para Stripe Checkout hosted page.

#### Etapa 3: webhook de subscription

Ao receber eventos Stripe:

- `checkout.session.completed`: cria ou atualiza registo base em `subscriptions`
- `customer.subscription.created|updated`: atualiza `subscriptions`, ativa `users.isVip`, define `subscriptionTier = vip`, cria entitlements VIP
- `customer.subscription.deleted`: desativa VIP e entitlements

#### Efeito no produto

Depois do webhook:

- `GET /api/subscription` passa a refletir plano/estado
- `GET /api/feed` pode ordenar por compatibilidade
- `getUserLimits()` deixa de impor limites de matches/messages
- outras capacidades como `see_likes`, `private_photos` e `reservation_priority` ficam logicamente desbloqueadas

## 10. Lacunas, inconsistências e notas para outro LLM

### Lacunas funcionais observáveis

- `PATCH /api/users/me` não aplica todos os campos que o onboarding envia.
- coexistem dois fluxos de persistência de fotos (`/photos` e `/photos/confirm`).
- webhook Clerk valida assinatura mas não cria/atualiza utilizadores.
- mobile ainda não consome a maior parte destas APIs.
- serviços dedicados não espelham a lógica do web app.

### Inconsistências estruturais

- schema runtime e schema de migrations divergentes.
- uso misto de Drizzle typed queries e SQL raw.
- algumas operações de storage parecem usar URL onde provavelmente seria esperada a object key.
- schema central de env não cobre todas as variáveis realmente usadas no código.

### Nível de confiança por área

- alta confiança: visão de produto, route inventory, fluxo de billing, matching básico, estrutura do monorepo
- média confiança: detalhes de storage e de moderação por causa do dual schema e de helpers não lidos aqui
- baixa confiança: readiness real de deploy end-to-end sem setup de infra/segredos

## 11. Ficheiros prioritários para leitura humana/LLM

- `README.md`
- `docs/decisions/0001-monorepo-architecture.md`
- `docs/decisions/0002-stack-selection.md`
- `apps/web/src/app/[locale]/layout.tsx`
- `apps/web/src/app/[locale]/page.tsx`
- `apps/web/src/app/api/feed/route.ts`
- `apps/web/src/app/api/feed/action/route.ts`
- `apps/web/src/app/api/messages/route.ts`
- `apps/web/src/app/api/webhooks/stripe/route.ts`
- `apps/web/src/lib/matching.ts`
- `apps/web/src/lib/entitlements.ts`
- `apps/web/src/lib/crypto.ts`
- `apps/web/src/lib/csam.ts`
- `packages/db/src/index.ts`
- `packages/db/src/schema.ts`
- `packages/db/src/schema/index.ts`

## 12. Conclusão

O projeto já tem forma de produto real e boundaries de domínio bem definidos, mas a implementação está concentrada no web app e ainda convive com sinais claros de transição arquitetural. A versão correta do contexto para outro LLM é: trata isto como um monorepo onde o `apps/web` é a fonte da verdade operacional e onde o maior cuidado técnico deve incidir em dados, contratos de API e sincronização entre schemas, auth e billing.