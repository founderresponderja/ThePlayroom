# The Playroom - Contexto Técnico do Repositório

Data de geração: 2026-07-07

## 1. Visão Geral e Domínio

The Playroom é uma plataforma adults-only, privacy-first, orientada para a comunidade de consensual non-monogamy (CNM) / lifestyle. O produto combina quatro eixos de negócio que se interligam:

1. Perfis e descoberta social para singles, casais, clubes e lojas.
2. Matching com base em preferências, limites e resultados de um kink test.
3. Eventos e clubes, com reservas, prioridade VIP e revelação controlada de localização.
4. Marketplace curado para sex shops, com pagamentos Stripe e onboarding de sellers.

### Proposta de valor central

- Privacidade forte por defeito: perfis verificados, localização aproximada, fotos privadas e messaging com payload encriptado.
- Comunidade segmentada por tipo de conta: single feminina, single masculina, casal MF/MM/FF, swing club, sex shop.
- Monetização híbrida: subscrição VIP para utilizadores finais e add-ons / capabilities para contas business.
- Trust & Safety como requisito de produto, não detalhe secundário: age gate, verificação, moderação, reporting, auditoria e placeholder de CSAM scanning.

### Lógica de negócio central observável no código

#### Onboarding

O fluxo de onboarding recolhe tipo de conta, idade, nome visível e localização aproximada, e redireciona o utilizador para o próximo fluxo conforme a natureza da conta:

- perfis sociais seguem para kink test;
- swing clubs seguem para club setup;
- sex shops seguem para shop setup.

#### Matching

O motor de compatibilidade usa tags derivadas do quiz. Há três conceitos explícitos:

- tags positivas normais;
- hard limits com prefixo `no:`;
- interesses suaves com prefixo `curious:`.

O algoritmo elimina candidatos incompatíveis quando uma preferência positiva do utilizador colide com um hard limit do outro lado. Nos restantes casos calcula similaridade por interseção/união de tags positivas, equivalente a um Jaccard simplificado. Utilizadores VIP recebem feed reordenado por compatibilidade; utilizadores free recebem ordem aleatória e limite diário de matches.

#### Messaging

As mensagens são persistidas como `encrypted_payload`, e o frontend usa libsodium / NaCl sealed boxes. O modelo é “payload encriptado armazenado no servidor”, com a chave pública do utilizador guardada na tabela `users` e o par de chaves persistido no browser via `localStorage`.

#### Eventos e clubes

Existem duas entidades distintas:

- `clubs`, para venues/comunidades permanentes;
- `events`, para ocorrências com capacidade, privacidade, ticketing e localização controlada.

As reservas (`reservations`) suportam estado, score de prioridade e revelação tardia da localização.

#### Marketplace

O produto inclui sellers (`shops`), catálogo (`products`), encomendas (`orders` / `order_items`) e integração Stripe/Stripe Connect. Produtos são subject to age restriction e moderação.

#### Entitlements / monetização

O código separa:

- um flag simples `isVip` no utilizador para features premium de utilizador final;
- tabela `entitlements` para capacidades business ou grants adicionais.

### Maturidade funcional atual

O domínio está muito mais avançado no schema e nas API routes do `apps/web` do que nos serviços dedicados. Em termos práticos, o web app funciona hoje como frontend + backend application monolith, enquanto `services/api`, `services/realtime` e `services/workers` ainda estão em estado inicial.

## 2. Tech Stack

## Stack transversal do monorepo

- Package manager: `pnpm` 8
- Monorepo/orquestração: `Turborepo`
- Linguagem dominante: `TypeScript`
- Lint/format: `ESLint` + `Prettier`
- Testes: `Vitest` (uso ainda muito limitado)
- CI/CD: `GitHub Actions`

## Frontend Web

- `Next.js 14.2.5` com `App Router`
- `React 18.3.1`
- `Tailwind CSS`
- `next-intl` para i18n
- `@clerk/nextjs` para auth
- `@stripe/stripe-js` + `stripe`
- `@googlemaps/js-api-loader`
- `ably` para realtime client-side
- `libsodium-wrappers` para encriptação
- `web-push` para push notifications browser
- `@aws-sdk/client-s3` e `@aws-sdk/s3-request-presigner` para storage compatível com S3/R2

## Frontend Mobile

- `Expo` managed workflow
- `expo-router`
- `React Native 0.71`
- `@clerk/expo`
- `expo-secure-store`
- `expo-notifications`

## Backend / Dados

- Runtime backend: `Node.js`
- API service stub: `Express`
- Realtime service stub: `ws`
- Base de dados: `Postgres` (arquiteturalmente pensado para Neon)
- ORM / migrations: `Drizzle ORM` + `drizzle-kit`
- Driver SQL: `postgres`
- Validação: `zod`

## Integrações externas explícitas

- Clerk
- Stripe Billing
- Stripe Connect
- Google Maps
- Ably
- S3/R2 compatible object storage
- Svix para verificação de webhooks Clerk
- Make.com via webhook operacional

## Dependências realmente instaladas por workspace

### Raiz

- `turbo`, `typescript`, `eslint`, `prettier`, `vitest`
- plugins TS/React/Import/JSX a11y

### `apps/web`

- foco em auth, billing, maps, crypto, i18n, push, storage e DB access direto

### `apps/admin`

- Next.js + Clerk + packages partilhados, mas UI ainda placeholder

### `apps/mobile`

- Expo + router + auth mobile, ainda sem domínio funcional profundo

### `packages/core`

- neste momento apenas `zod`

### `packages/db`

- `drizzle-orm`, `drizzle-kit`, `postgres`

### `services/api`

- `express`, `zod`, `@playroom/db`

### `services/realtime`

- `ws`, `@playroom/core`

### `services/workers`

- apenas `@playroom/core`

## 3. Arquitetura do Projeto

## Forma arquitetural real

O repositório é um monorepo por domínios/plataformas, mas a implementação atual está mais próxima de um “modular monolith inside Next.js” do que de um conjunto de microserviços maduros.

### Estrutura macro

- `apps/*`: superfícies de entrega ao utilizador
- `packages/*`: bibliotecas partilhadas de tipos, dados, config e UI
- `services/*`: serviços backend separados, ainda embrionários
- `docs/*`: ADRs e artefactos legais

### Padrão dominante por agora

#### 1. Backend-for-Frontend dentro do `apps/web`

Grande parte da lógica de aplicação vive em `apps/web/src/app/api/*`:

- autenticação contextual com Clerk server helpers;
- leitura/escrita na base de dados;
- fluxos de feed, mensagens, verificação, produtos, reservas, billing e webhooks.

Isto significa que hoje o `apps/web` acumula responsabilidades de:

- UI SSR/CSR;
- camada de API;
- orchestration de domínio;
- integrações externas.

#### 2. Shared kernel fino

`packages/core` deveria ser o shared domain kernel, mas ainda é extremamente magro. Hoje quase toda a lógica de negócio está no web app e não numa camada de domínio reutilizável.

#### 3. Data access centralizado em package compartilhado

`packages/db` concentra schema e bootstrap do Drizzle, funcionando como um “data access package” consumido diretamente por apps e serviços.

#### 4. Design system básico

`packages/ui` neste momento partilha sobretudo tokens de tema. Ainda não há uma biblioteca rica de componentes cross-platform.

## Design patterns evidentes

- Monorepo modular por bounded context/plataforma.
- Backend-for-Frontend no Next App Router.
- Feature gating via flags/entitlements.
- Shared database package.
- Webhook-driven state sync para billing/auth.
- Client-side cryptography para mensagens privadas.
- Route-based modularity do App Router em vez de camadas clássicas MVC.

## O que não está claramente presente

- Clean Architecture formal.
- DDD tático forte em packages centrais.
- Event-driven backend completo.
- microservices maduros em produção dentro da própria repo.

## Tensão arquitetural importante

Existe uma divergência estrutural no pacote `db`:

- `packages/db/src/schema.ts` define tabelas com IDs `serial/integer` e é a superfície exportada pelo runtime através de `packages/db/src/index.ts`.
- `packages/db/src/schema/index.ts` define um schema mais rico e moderno com `uuid`, enums Postgres e colunas ligeiramente diferentes.
- `packages/db/drizzle.config.ts` aponta para `./src/schema/index.ts` para geração de migrations.

Isto sugere fortemente coexistência de dois modelos de schema, potencialmente com risco de drift entre:

- o schema consumido no código em runtime;
- o schema usado para migrations.

Este é um dos detalhes mais importantes do estado atual do projeto, porque afeta a confiança em queries, tipos e futuras migrações.

## 4. Estrutura de Diretórios

```text
.
├── apps/
│   ├── admin/          # dashboard admin Next.js, ainda muito inicial
│   ├── mobile/         # app Expo/React Native com auth guard e tabs placeholder
│   └── web/            # principal superfície implementada: UI + API routes + webhooks
├── docs/
│   ├── decisions/      # ADRs de arquitetura e stack
│   └── legal/          # documentos legais placeholder
├── packages/
│   ├── config/         # schema de env e config partilhada
│   ├── core/           # domínio partilhado, atualmente muito fino
│   ├── db/             # Drizzle schema, bootstrap DB, config de migrações
│   └── ui/             # tokens visuais e base de design system
├── services/
│   ├── api/            # Express health stub
│   ├── realtime/       # WebSocket echo stub
│   └── workers/        # worker stub
├── .github/workflows/  # CI e deploy
├── package.json        # scripts raiz do monorepo
├── pnpm-workspace.yaml # definição de workspaces
├── turbo.json          # pipeline build/dev/lint/typecheck
└── tsconfig.base.json  # strict TS config transversal
```

## Mapeamento resumido por área

### `apps/web`

Contém a implementação mais relevante do produto.

- `src/app/`: rotas App Router, páginas server/client e route handlers.
- `src/app/[locale]/`: superfícies localizadas do produto.
- `src/app/api/`: API routes com lógica de negócio e integrações.
- `src/components/`: componentes reutilizáveis UI/web.
- `src/lib/`: lógica de suporte crítica, como matching, crypto, Stripe, R2, CSAM, admin e notificações.
- `messages/`: traduções `pt`, `en`, `es`.
- `middleware.ts`: integração Clerk + next-intl.

### `apps/mobile`

- `app/`: rotas Expo Router.
- `(auth)`: sign-in.
- `(tabs)`: navegação principal placeholder para home, matches, events, shop, profile.
- `src/lib/api.ts`: helper de fetch apontado para `EXPO_PUBLIC_API_URL` ou `https://theplayroom.pt` por defeito.

### `apps/admin`

- estrutura Next.js simples;
- estado atual praticamente placeholder visual.

### `packages/config`

- schema Zod de environment com chaves para DB, Clerk, Stripe, Maps, Expo Push e JWT.

### `packages/core`

- exporta apenas `AccountType` e respetivo teste.
- sinaliza intenção de crescer como shared domain package, mas ainda não é o centro do domínio.

### `packages/db`

- bootstrap `db` com Drizzle.
- re-export de operators Drizzle para evitar dual-instance type issues sob pnpm.
- duas superfícies de schema coexistentes.

### `packages/ui`

- tokens de tema, tipografia e cores.
- paleta dominante: preto/bordô/vermelho/fúcsia.

### `services/*`

- preparados como boundary futuro, mas ainda sem lógica efetiva.

## 5. Componentes Principais

## Frontend / App Shell crítico

### `apps/web/src/app/[locale]/layout.tsx`

É o layout de topo do produto web. Envolve:

- `ClerkProvider`
- `NextIntlClientProvider`
- script inline para tema
- navbar global
- `AgeGate`

Este ficheiro estabelece auth, i18n e shell visual em toda a experiência localizada.

### `apps/web/src/app/[locale]/page.tsx`

Landing page localizada com posicionamento de produto muito explícito: privacidade, verificação, kink test, eventos, marketplace e pricing. Serve de fonte forte para inferir intenção de produto e target audience.

## Lógica de negócio crítica no web app

### Feed e descoberta

`apps/web/src/app/api/feed/route.ts`

Responsabilidades:

- resolve utilizador atual via Clerk;
- garante onboarding completo;
- aplica limite diário de matches para free users;
- exclui perfis já vistos;
- carrega candidatos e fotos públicas;
- reordena por compatibilidade para VIP.

É um dos melhores ficheiros para compreender monetização, matching e políticas de produto num só local.

### Matching

`apps/web/src/lib/matching.ts`

Contém a implementação explícita do algoritmo de compatibilidade.

### Entitlements

`apps/web/src/lib/entitlements.ts`

Centraliza capacidades premium/business, distinguindo o que vem de `isVip` e o que exige uma linha ativa em `entitlements`.

### Onboarding

`apps/web/src/app/[locale]/onboarding/OnboardingWizard.tsx`

Define o principal funnel de entrada e a taxonomia de conta. Apesar de simples, é um ficheiro-chave para perceber o modelo de utilizadores.

### Messaging

`apps/web/src/app/api/messages/route.ts`

Implementa leitura/escrita de mensagens, valida que o utilizador pertence à thread e persiste `encryptedPayload`.

### Gestão de chaves

`apps/web/src/lib/crypto.ts`

Implementa geração de keypair, cifragem e decifragem usando libsodium, bem como persistência local de chaves no browser.

`apps/web/src/app/api/keypair/route.ts` faz o bind da chave pública do utilizador à tabela `users`.

### Fotos, storage e moderação

Fluxo principal:

- `apps/web/src/app/api/photos/upload-url/route.ts`: emite presigned URL.
- upload é feito para object storage.
- `apps/web/src/app/api/photos/confirm/route.ts`: vai buscar a imagem, corre scan CSAM, apaga se necessário e cria a row na DB.

Este fluxo mostra bem o foco em segurança por pipeline assíncrona/confirmada, mesmo que a integração de scanning ainda seja placeholder.

### Segurança/Trust & Safety

`apps/web/src/lib/csam.ts`

É crítico do ponto de vista de compliance. Atualmente não integra fornecedor real; em produção, se a chave não existir, bloqueia uploads. Há também um hook para report operacional via Make webhook.

### Billing e monetização

`apps/web/src/app/api/webhooks/stripe/route.ts`

É o centro real de sincronização de:

- subscriptions;
- `isVip` / `subscriptionTier`;
- entitlements;
- marcação de orders como pagas.

### Auth sync

`apps/web/src/app/api/webhooks/clerk/route.ts`

Valida assinatura Svix, mas ainda não sincroniza utilizadores para a base de dados. É um boundary incompleto que outro LLM deve tratar como risco funcional atual.

## Camada de dados crítica

### `packages/db/src/index.ts`

- instancia o client Postgres/Drizzle;
- exporta schema;
- re-exporta operators Drizzle para evitar conflitos de instância em monorepo pnpm.

### `packages/db/src/schema.ts`

É a superfície de dados que o runtime aparenta consumir hoje. Modela:

- utilizadores;
- perfis;
- fotos;
- verificações;
- quiz results;
- clubes;
- eventos;
- reservas;
- matches;
- threads/messages;
- subscriptions/entitlements;
- push subscriptions;
- shops/products/orders/payouts;
- notifications/reports/audit logs/consents.

## Frontends secundários

### `apps/mobile/app/_layout.tsx`

Contém o auth guard principal da app mobile usando Clerk + Expo Router + SecureStore. A app mobile está corretamente posicionada como consumer futuro da plataforma, mas ainda não expõe as capacidades de domínio que a web já possui.

### `apps/admin/src/app/page.tsx`

Admin dashboard de placeholder. O texto revela intenção explícita para queues de verificação, reports e moderação, mas não há ainda implementação equivalente ao que o web app já expõe via admin routes/pages localizadas.

## Serviços dedicados

### `services/api/src/index.ts`

Express com apenas `/api/health`.

### `services/realtime/src/index.ts`

WebSocket server mínimo que apenas faz echo/ack de mensagens recebidas.

### `services/workers/src/index.ts`

Só escreve “Worker service started.”.

Conclusão: a intenção arquitetural aponta para separação de serviços, mas o estado operacional atual continua centrado no `apps/web`.

## 6. Modelo de Dados e Boundaries de Domínio

## Principais aggregates / entidades

### Identidade e perfil

- `users`
- `profiles`
- `photos`
- `verifications`
- `consents`

### Compatibilidade e mensagens

- `quiz_results`
- `matches`
- `threads`
- `messages`

### Eventos e venues

- `clubs`
- `events`
- `reservations`

### Subscrições e capabilities

- `subscriptions`
- `entitlements`
- `push_subscriptions`

### Marketplace

- `shops`
- `products`
- `orders`
- `order_items`
- `payouts` (presente em `schema.ts` runtime, ausente na variante `schema/index.ts` lida antes)

### Governance e Trust & Safety

- `notifications`
- `reports`
- `audit_logs`

## Leitura arquitetural do domínio

O modelo mistura rede social privada, event platform e marketplace multi-sided. Isso tem impacto direto na complexidade:

- um utilizador pode ser pessoa, casal, clube ou seller;
- o sistema precisa de controlar acesso por idade, verificação, tipo de conta e plano;
- há requisitos de segurança e compliance significativamente mais elevados do que num marketplace ou dating app genérico.

## 7. Estado Atual / Convenções

## Convenções de código

### TypeScript

O `tsconfig.base.json` ativa modo estrito e várias proteções:

- `strict`
- `noUncheckedIndexedAccess`
- `noImplicitAny`
- `noImplicitReturns`
- `noFallthroughCasesInSwitch`

Isto indica intenção de disciplina de tipos, mesmo que algumas áreas ainda usem workarounds como `(db as any)`.

### Estilo

- indentação de 2 espaços
- `singleQuote: true`
- `trailingComma: all`
- `semi: true`
- `printWidth: 100`

### ESLint

Regras relevantes:

- return types explícitos exigidos em TS, com exceção de expressions;
- `no-explicit-any` marcado como erro;
- `no-unused-vars` estrito com exceção `_`;
- `no-console` como warning, permitindo apenas `warn` e `error`.

Observação importante: o código atual nem sempre segue totalmente estas regras, o que sugere ou tolerância operacional ou debt pendente.

## Convenções de produto e naming

- tipos de conta em `SCREAMING_SNAKE_CASE`;
- features/entitlements em `snake_case`;
- nomes de colunas DB em `snake_case`;
- componentes React em `PascalCase`;
- rotas App Router orientadas a feature (`events`, `matches`, `shop`, `verification`, `admin`, etc.).

## i18n

- locales ativas: `pt`, `en`, `es`
- locale por defeito: `pt`
- prefixo sempre presente na URL (`/pt`, `/en`, `/es`)

Isto faz da variante portuguesa a experiência base do produto, apesar de muito do texto técnico e de alguns placeholders ainda estar em inglês.

## Theming / design

O sistema visual partilhado usa uma identidade forte dark-first com vermelho/fúcsia:

- `bg`: quase preto
- `primary`: vermelho vivo
- `accent`: rosa/fúcsia
- tipografia display/body `Max`

Também existe variante light, mas a documentação e shell indicam preferência prática por dark theme.

## Scripts importantes

### Raiz

- `pnpm dev` -> `turbo run dev`
- `pnpm build` -> `turbo run build`
- `pnpm lint` -> `turbo run lint`
- `pnpm typecheck` -> `turbo run typecheck`
- `pnpm test` -> `turbo run test`
- `pnpm format` -> `prettier --write .`

### Web

- `next dev --port 3000`
- `next build`
- `next lint`
- `tsc --noEmit`

### Mobile

- `expo start`
- `eas build --platform all --non-interactive`

### DB

- `db:generate`
- `db:migrate`
- `db:push`
- `db:studio`

## CI/CD

### CI

O workflow de CI faz:

- checkout
- `pnpm install`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`

### Deploy

O workflow de deploy faz:

- `pnpm install`
- `pnpm build`
- deploy para Vercel via action externa
- build mobile via EAS se a build tiver sucesso

## Testing atual

A cobertura observável é mínima. Existe um teste explícito em `packages/core/src/__tests__/accountType.test.ts`, que valida apenas o schema Zod de tipos de conta. Não há sinais, nesta leitura, de uma suite robusta cobrindo matching, billing, webhooks, fotos, feed ou moderação.

## Dependência de environment variables

O schema em `packages/config/src/env.ts` evidencia dependências críticas de runtime:

- `DATABASE_URL`
- chaves Clerk
- chaves Stripe
- `GOOGLE_MAPS_API_KEY`
- `JWT_SECRET`
- integrações opcionais como Expo Push e Make webhook

Há ainda variáveis usadas noutros pontos, como:

- `CSAM_SCANNER_API_KEY`
- `CSAM_REPORT_ENDPOINT`
- `MAKE_OPS_WEBHOOK_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`

Ou seja, o schema central de env ainda não representa exaustivamente todas as dependências reais do código.

## 8. Leitura de Maturidade e Riscos Arquiteturais

## Fortes sinais positivos

- visão de produto muito clara e coerente com o schema;
- separação monorepo bem pensada;
- escolha tecnológica consistente com time-to-market em web/mobile;
- foco genuíno em privacidade, verificação e segurança;
- integração já prevista com billing, storage, push e webhooks.

## Gaps materiais do estado atual

### 1. `apps/web` concentra quase tudo

O boundary entre frontend e backend ainda não está consolidado. Outro LLM deve assumir que a maioria dos fluxos críticos vive em `apps/web/src/app/api`, não em `services/api`.

### 2. Dual schema no pacote DB

Este é provavelmente o maior risco técnico estrutural. Há duas definições de schema com diferenças reais:

- `integer/serial` vs `uuid`
- presença/ausência de tabelas/colunas
- enums dedicados numa variante e strings simples noutra

Isto pode introduzir mismatches em migrations, tipos e queries.

### 3. Mobile e serviços ainda não refletem o domínio já existente

Há uma assimetria forte entre a sofisticação do web app e o estado do mobile/admin/services.

### 4. Compliance ainda incompleto

- CSAM scanning é placeholder
- docs legais ainda placeholder
- webhook de Clerk não materializa sync de utilizadores

### 5. Shared core subaproveitado

`packages/core` ainda não absorveu a lógica que faria sentido partilhar entre web, mobile e serviços, como:

- tipos de domínio mais ricos
- regras de matching
- políticas de entitlement
- contracts de API

## 9. Conclusão operacional para outro LLM

Se outro modelo tiver de trabalhar neste projeto, a leitura correta do estado atual é:

1. É um monorepo TypeScript/Turborepo com intenção multiplataforma real.
2. A implementação funcional mais importante está em `apps/web`.
3. `apps/web` é simultaneamente frontend, API layer, webhook processor e orchestration layer.
4. `packages/db` é central, mas contém uma divergência séria entre schema runtime e schema de migrações.
5. `packages/core` ainda não é o verdadeiro kernel de domínio, apesar do nome sugerir isso.
6. O produto já codifica preocupações avançadas de privacidade, verificação, monetização e moderação.
7. Mobile, admin e serviços dedicados devem ser lidos como superfícies em construção, não como fontes primárias da lógica atual.

## 10. Ficheiros-Chave para abrir primeiro

Se o objetivo for maximizar compreensão rápida do sistema, estes são os melhores pontos de entrada:

- `README.md`
- `docs/decisions/0001-monorepo-architecture.md`
- `docs/decisions/0002-stack-selection.md`
- `apps/web/src/app/[locale]/layout.tsx`
- `apps/web/src/app/[locale]/page.tsx`
- `apps/web/src/app/api/feed/route.ts`
- `apps/web/src/lib/matching.ts`
- `apps/web/src/lib/entitlements.ts`
- `apps/web/src/lib/crypto.ts`
- `apps/web/src/lib/csam.ts`
- `apps/web/src/app/api/messages/route.ts`
- `apps/web/src/app/api/webhooks/stripe/route.ts`
- `apps/web/src/app/api/webhooks/clerk/route.ts`
- `packages/db/src/index.ts`
- `packages/db/src/schema.ts`
- `packages/db/src/schema/index.ts`

Esses ficheiros dão contexto suficiente para entender produto, dados, monetização, segurança, estado de implementação e os principais riscos arquiteturais.