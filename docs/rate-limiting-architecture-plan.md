# 📋 PLANO DE AÇÃO: RATE LIMITING ESCALÁVEL + LOAD TESTING

**Status:** Planejamento Arquitetural (Sem Alterações de Código)  
**Data:** 2026-07-14  
**Audience:** CTO + Engenharia  
**Objetivo:** Implementação de proteção contra abuso IA/BD com validação de carga segura

---

## 1️⃣ ARQUITETURA DE RATE LIMITING COM UPSTASH REDIS

### 1.1 Visão Geral da Solução

```
┌─────────────────────────────────────────────────────────────┐
│                     VERCEL SERVERLESS                       │
├─────────────────────────────────────────────────────────────┤
│  Next.js 14 (App Router, Edge + Node Handlers)              │
│  ├─ Middleware (Edge Runtime)                               │
│  │  └─ Rate Limit Check para rotas sensíveis                │
│  │     → Upstash Redis (latência <1ms)                      │
│  └─ API Routes (Node Runtime)                               │
│     ├─ /api/quiz (OpenAI)         → RateLimit: 5/dia        │
│     ├─ /api/profile (OpenAI)      → RateLimit: 10/dia       │
│     ├─ /api/orders (Payment)      → RateLimit: 50/dia       │
│     ├─ /api/matches (BD read)     → RateLimit: 100/dia      │
│     └─ /api/health (Health)       → NO RateLimit (test)     │
└─────────────────────────────────────────────────────────────┘
         │
         ↓ (API Call via HTTPS)
┌─────────────────────────────────────────────────────────────┐
│            UPSTASH REDIS (Managed Service)                  │
│  ├─ Geo-replicado (< 5ms latência global)                   │
│  ├─ Endpoint: https://[UPSTASH_REDIS_REST_URL]              │
│  ├─ Auth: UPSTASH_REDIS_REST_TOKEN                          │
│  └─ Storage: Keys como "ratelimit:{userId}:{endpoint}"      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Estratégia de Rate Limiting: Token Bucket vs Sliding Window

#### **Opção A: Token Bucket (Recomendado para IA)**
```
Vantagens:
✅ Permite bursts curtos (ex: 3 requsts em rápida sucessão)
✅ Simples de implementar com Redis
✅ Melhor para APIs com uso em picos

Configuração para /api/quiz:
- Tokens: 5 por dia (86400 segundos)
- Refill rate: 5 / (24h) = 0.000058 tokens/segundo
- Burst: 0 (sem acelerar)

Implementação:
```
ratelimit:{userId}:quiz = {
  "tokens": 5.0,
  "refillTime": "2026-07-14T00:00:00Z"
}
```
Cada POST /api/quiz:
- Calcula tokens desde último refill
- Se tokens < 1: Retorna 429 "Rate Limit Exceeded"
- Se tokens >= 1: Consome 1 token, permite request
```

#### **Opção B: Sliding Window (Alternativa)**
```
Vantagens:
✅ Mais justo para janelas de tempo fixas
✅ Sem "reset" abrupto de quota

Configuração para /api/quiz:
- Limite: 5 requests per 24h
- Janela: 86400 segundos

Implementação:
```
ratelimit:{userId}:quiz = {
  "requests": [
    1721001234,  # timestamp do 1º request
    1721001245,  # timestamp do 2º request
    ...
  ]
}
```
Cada POST /api/quiz:
- Remove requests > 24h atrás
- Se count < 5: Permite + adiciona timestamp
- Se count >= 5: Retorna 429
```

**Recomendação:** Token Bucket para IA (mais permissivo em caso de falhas BD), Sliding Window para pagamentos (mais justo).

---

### 1.3 Integração com Upstash: Variáveis de Ambiente

#### **Passo 1: Criar Conta Upstash**
```bash
# 1. Ir para https://console.upstash.com
# 2. Criar novo Redis DB (Free Tier: 10k commands/dia)
# 3. Copiar credenciais
```

#### **Passo 2: Variáveis de Ambiente Necessárias**

```env
# .env.local (desenvolvimento)
UPSTASH_REDIS_REST_URL=https://[database-id].upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...your_secure_token_here...

# .env.production (Vercel)
# (mesmo valores configurados via Dashboard Vercel)
```

**Segurança:**
- ✅ `UPSTASH_REDIS_REST_TOKEN` é secreto (como senhas DB)
- ✅ Use apenas via variáveis de ambiente, nunca hardcode
- ✅ Vercel criptografa em trânsito (HTTPS)
- ✅ Upstash oferece TLS encryption

#### **Passo 3: Instalação do Pacote**

```bash
# No apps/web
pnpm add @upstash/ratelimit @upstash/redis

# Adiciona 2 dependências:
# - @upstash/redis: HTTP client para Upstash
# - @upstash/ratelimit: Abstração de rate limiting
```

---

### 1.4 Pontos de Integração: Middleware vs. Route Handlers

#### **Arquitetura Recomendada:**

```
┌─────────────────────────────────────┐
│   Middleware.ts (Edge Runtime)      │
├─────────────────────────────────────┤
│ Protege rotas genéricas:            │
│ - /api/* (todas as rotas API)       │
│ - Rate limit global: 1000 req/min   │
│ - Detecta suspeitas (IP blocks)     │
└────────┬────────────────────────────┘
         │
         ├─ Passa ✅
         │
         ↓
┌─────────────────────────────────────┐
│  Route Handlers (Node Runtime)      │
├─────────────────────────────────────┤
│ Rate limits específicos:             │
│ - /api/quiz          → 5/dia (IA)   │
│ - /api/profile       → 10/dia (IA)  │
│ - /api/orders        → 50/dia (pay) │
│ - /api/matches       → 100/dia (BD) │
│ - /api/health        → ∞ (test)     │
└─────────────────────────────────────┘
```

#### **Estratégia 1: Rate Limit em Middleware (Global)**

```typescript
// middleware.ts (Edge)

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(1000, '60 s'), // 1000 req/min global
  analytics: true,
})

export default clerkMiddleware(async (auth, req) => {
  // ... existing Clerk + i18n logic ...

  // Rate limit check APENAS para /api/* (não bloqueia outras rotas)
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const ip = req.ip || 'unknown'
    const { success, pending, limit, reset, remaining } = await ratelimit.limit(ip)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: reset },
        { status: 429 }
      )
    }
  }

  return NextResponse.next()
})
```

**Vantagens:**
- ✅ Proteção global contra floods
- ✅ Apenas 1 chamada Redis por request
- ✅ Funciona em Edge (latência <1ms)

**Desvantagens:**
- ❌ Limite global, não específico por endpoint
- ❌ Não diferencia user autenticado vs. anónimo

#### **Estratégia 2: Rate Limit em Route Handlers (Específico)**

```typescript
// apps/web/src/app/api/quiz/route.ts (Node)

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.tokenBucket(5, '24 h'), // 5 requests/24h
  analytics: true,
})

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit check específico para este endpoint
  const key = `quiz:${userId}` // Per-user rate limit
  const { success, limit, reset, remaining } = await ratelimit.limit(key)
  
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: reset, remaining },
      { status: 429 }
    )
  }

  // ... resto da lógica POST ...
}
```

**Vantagens:**
- ✅ Rate limit específico por endpoint
- ✅ Per-user (não global por IP)
- ✅ Diferencia autenticado vs. anónimo

**Desvantagens:**
- ❌ Cada route precisa de seu próprio init
- ❌ Mais chamadas Redis (1 por endpoint)

#### **Recomendação Arquitetural:**

```
Usar AMBOS em conjunto:

1. Middleware: Proteção global (1000 req/min por IP)
   └─ Captura floods de atacantes anónimos

2. Route Handlers: Proteção específica por endpoint
   └─ /api/quiz: 5 req/dia per user
   └─ /api/profile: 10 req/dia per user
   └─ /api/orders: 50 req/dia per user
   └─ /api/matches: 100 req/dia per user
   └─ /api/health: ∞ (sem rate limit)

Decisão de IP vs. User:
   - Middleware: Por IP (para anónimos)
   - Route: Por userId (para autenticados)
```

---

### 1.5 Configuração de Rate Limits por Endpoint

#### **Matriz de Limites Recomendados:**

| Endpoint | Tipo | Limite | Janela | Razão | Risco se ∞ |
|----------|------|--------|--------|-------|------------|
| `/api/quiz` | POST | 5 | 24h | Custo OpenAI (~0.05¢/req) | ~€3.65/user/dia |
| `/api/profile` | PATCH | 10 | 24h | Custo OpenAI (~0.05¢/req) | ~€7.30/user/dia |
| `/api/orders` | POST | 50 | 24h | Custo pagamentos (Stripe) | Spam pagamentos |
| `/api/matches` | GET | 100 | 24h | Custo BD (reads) | DB overload |
| `/api/messages` | GET/POST | 200 | 24h | Chat - alto volume aceitável | DB overload |
| `/api/feed` | GET | 100 | 24h | Feed com DB joins | DB overload |
| `/api/health` | GET | ∞ | - | Health checks (não usa IA/BD) | Sem risco |
| `/api/admin/*` | * | 50 | 24h | Proteção contra abuso admin | Spam moderation |

---

### 1.6 Custo e Performance do Upstash

#### **Custo Estimado:**

```
Tier: Free (Gratuito)
- 10,000 commands/dia
- 1 DB
- Latência: <5ms global

Estimativa de Usage em Produção (MVP):
- 1000 utilizadores ativos/dia
- Middleware check: 1 cmd por request (~100 requests/user/dia)
  = 1000 × 100 = 100k commands/dia
- Route checks: +50k commands/dia (endpoints específicos)
- Total: ~150k commands/dia

Conclusão: PAGA tier necessário (Pro: €50/mês com 1M commands/dia)

Alternativa Gratuita: Redis em memória + MemoryStore Vercel (beta)
- Mas não suporta rate limiting robusto em Serverless
```

#### **Performance em Vercel:**

```
Latência esperada:
- Middleware check: 0-50ms (Edge)
- Route check: 5-20ms (Node) + Redis REST: <5ms
- Total overhead: ~25ms por request

Impacto UX:
- Aceitável (imperceptível para utilizador)
- Benefício >> Custo (protege contra abuso IA €1000s/mês)
```

---

### 1.7 Tratamento de Respostas 429

#### **Response JSON (Padronizado):**

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "remaining": 0,
  "limit": 5,
  "reset": 1721088000,
  "retryAfter": 86400,
  "message": "Atingiu limite de 5 pedidos por dia. Tente novamente em 24 horas."
}
```

#### **Header HTTP:**

```
HTTP/1.1 429 Too Many Requests
Retry-After: 86400
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1721088000
```

#### **Frontend Handling:**

```typescript
// Exemplo em React
const handleQuizSubmit = async (data) => {
  try {
    const res = await fetch('/api/quiz', { method: 'POST', body: JSON.stringify(data) })
    
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '3600')
      const resetTime = new Date(parseInt(res.headers.get('X-RateLimit-Reset')) * 1000)
      showError(`Limite atingido. Pode tentar novamente em ${resetTime.toLocaleString()}`)
      return
    }
    
    // ... resto do handling ...
  } catch (e) {
    // ...
  }
}
```

---

## 2️⃣ SCRIPT DE LOAD TESTING COM K6

### 2.1 O que é k6 e Por Que Usar?

```
k6: Ferramenta de Load Testing modular, open-source

Vantagens:
✅ Escreve testes em JavaScript/Go
✅ Executa em Vercel/CI/CD (dockerizado)
✅ Suporta cenários complexos (ramp-up, stress, soak)
✅ Métricas detalhadas (p95, p99, erros)
✅ Comparação com baselineSob HTTP nativo (sem browser overhead)

Instalação:
```bash
# Global
brew install k6  # macOS
sudo apt-get install k6  # Linux
choco install k6  # Windows

# Via Docker
docker run -i grafana/k6 run - < script.js
```

### 2.2 Script k6 de Teste de Carga (Seguro)

**Ficheiro:** `apps/web/load-tests/safe-endpoints.js`

```javascript
import http from 'k6/http'
import { check, group, sleep } from 'k6'

// Configuração do teste
export const options = {
  stages: [
    { duration: '5s', target: 10 },   // Ramp-up: 0 → 10 VUs em 5s
    { duration: '20s', target: 100 }, // Escala: 10 → 100 VUs em 20s
    { duration: '30s', target: 100 }, // Sustém: 100 VUs por 30s (TESTE PRINCIPAL)
    { duration: '5s', target: 0 },    // Ramp-down: 100 → 0 VUs em 5s
  ],
  thresholds: {
    // Fail se > 5% de requests falharem
    http_req_failed: ['rate<0.05'],
    // Fail se p95 latência > 2s
    http_req_duration: ['p(95)<2000'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'https://www.theplayroom.pt'

// Contador de requests por VU (para evitar rate limiting)
const requestCounter = {}

export default function () {
  const vu = __VU // Virtual User ID
  if (!requestCounter[vu]) requestCounter[vu] = 0

  // ============================================
  // TESTE 1: GET /api/health (Sem Limite)
  // ============================================
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/api/health`)
    
    check(res, {
      'status 200': (r) => r.status === 200,
      'response json': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
      'db reachable': (r) => r.json('database.reachable') === true,
      'status ok': (r) => r.json('status') === 'ok',
    })

    // Verificar se rate limit foi aplicado (não deve ser, pois sem limite)
    check(res, {
      'no rate limit': (r) => r.status !== 429,
    })
  })

  sleep(0.5) // Pequena pausa entre requests

  // ============================================
  // TESTE 2: GET /api/clubs (Leitura BD, sem auth)
  // ============================================
  group('Public Clubs List', () => {
    const res = http.get(`${BASE_URL}/api/clubs?page=1&limit=10`)
    
    check(res, {
      'status 200': (r) => r.status === 200 || r.status === 404, // 404 se sem dados
      'response json': (r) => r.headers['Content-Type']?.includes('application/json'),
      'no rate limit': (r) => r.status !== 429,
    })
  })

  sleep(0.5)

  // ============================================
  // TESTE 3: GET /api/products (Leitura BD, sem auth)
  // ============================================
  group('Products List', () => {
    const res = http.get(`${BASE_URL}/api/products?page=1&limit=20`)
    
    check(res, {
      'status 200': (r) => r.status === 200 || r.status === 404,
      'no rate limit': (r) => r.status !== 429,
      'valid json': (r) => {
        try {
          r.json()
          return true
        } catch {
          return false
        }
      },
    })
  })

  sleep(0.5)

  // ============================================
  // TESTE 4: GET /api/events (Leitura BD, sem auth)
  // ============================================
  group('Events List', () => {
    const res = http.get(`${BASE_URL}/api/events?page=1&limit=10`)
    
    check(res, {
      'status 200': (r) => r.status === 200 || r.status === 404,
      'no rate limit': (r) => r.status !== 429,
    })
  })

  sleep(1) // Pausa maior entre ciclos
}

// Função customizada para relatório
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  }
}
```

### 2.3 Alternativa: Script com Autenticação (Avançado)

Se quiseres testar endpoints autenticados (sem consumir IA/Stripe):

```javascript
import http from 'k6/http'
import { check, group, sleep } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'https://www.theplayroom.pt'
const TEST_USER_TOKEN = __ENV.TEST_USER_TOKEN // Clerk JWT token

export const options = {
  stages: [
    { duration: '5s', target: 10 },
    { duration: '20s', target: 100 },
    { duration: '30s', target: 100 },
    { duration: '5s', target: 0 },
  ],
}

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_USER_TOKEN}`,
  }

  // ============================================
  // TESTE: GET /api/matches (Leitura BD, autenticado)
  // ============================================
  group('Authenticated Matches Feed', () => {
    const res = http.get(`${BASE_URL}/api/matches?page=1&limit=20`, { headers })
    
    check(res, {
      'status 200': (r) => r.status === 200,
      'status 401': (r) => r.status === 401, // Se token inválido
      'no rate limit': (r) => r.status !== 429,
    })
  })

  sleep(1)

  // ============================================
  // TESTE: GET /api/messages (Leitura BD, autenticado)
  // ============================================
  group('Authenticated Messages', () => {
    const res = http.get(`${BASE_URL}/api/messages?threadId=test`, { headers })
    
    check(res, {
      'status 200 or 401': (r) => r.status === 200 || r.status === 401,
      'no rate limit': (r) => r.status !== 429,
    })
  })

  sleep(1)
}
```

### 2.4 Como Executar o Teste

#### **Localmente (Desenvolvimento):**

```bash
# Teste simples (sem config)
k6 run apps/web/load-tests/safe-endpoints.js

# Teste com URL customizada
k6 run --env BASE_URL=http://localhost:3000 apps/web/load-tests/safe-endpoints.js

# Teste com output detalhado
k6 run \
  --env BASE_URL=https://www.theplayroom.pt \
  --out json=results.json \
  apps/web/load-tests/safe-endpoints.js

# Teste em cloud (Grafana Cloud - opcional)
k6 cloud run apps/web/load-tests/safe-endpoints.js
```

#### **Em CI/CD (GitHub Actions):**

**Ficheiro:** `.github/workflows/load-test.yml`

```yaml
name: Load Test

on:
  workflow_dispatch: # Manual trigger
  schedule:
    - cron: '0 2 * * *' # Diário às 2:00 UTC

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install k6
        run: sudo apt-get install -y k6
      
      - name: Run Load Test
        run: |
          k6 run \
            --env BASE_URL=https://www.theplayroom.pt \
            --out json=results.json \
            apps/web/load-tests/safe-endpoints.js
      
      - name: Upload Results
        uses: actions/upload-artifact@v4
        with:
          name: load-test-results
          path: results.json
      
      - name: Check Thresholds
        run: |
          # Falha se rate de erro > 5% ou p95 > 2s
          # (k6 já faz isto, mas adiciona verificação extra)
          node -e "
            const data = require('./results.json')
            const metrics = data.metrics
            if (metrics.http_req_failed.values['rate'] > 0.05) {
              console.error('FAIL: Error rate > 5%')
              process.exit(1)
            }
          "
```

### 2.5 Métricas e Interpretação de Resultados

#### **Output Esperado:**

```
     data_received..................: 250 kB   2.5 kB/s
     data_sent.......................: 150 kB   1.5 kB/s
     http_req_blocked................: avg=5ms    min=1ms    med=2ms    max=50ms    p(90)=10ms   p(95)=25ms  
     http_req_connecting.............: avg=3ms    min=0s     med=0s     max=45ms    p(90)=5ms    p(95)=20ms  
     http_req_duration...............: avg=80ms   min=10ms   med=70ms   max=800ms   p(90)=150ms  p(95)=250ms ✓
     http_req_failed.................: 0.00% ✓ < 5%
     http_req_receiving..............: avg=5ms    min=1ms    med=3ms    max=100ms   p(90)=10ms   p(95)=20ms
     http_req_sending................: avg=2ms    min=0s     med=1ms    max=50ms    p(90)=5ms    p(95)=10ms
     http_req_tls_handshaking........: avg=20ms   min=0s     med=10ms   max=200ms   p(90)=50ms   p(95)=100ms
     http_req_waiting................: avg=70ms   min=5ms    med=60ms   max=700ms   p(90)=140ms  p(95)=230ms
     http_reqs.......................: 10000    100.0/s
     iteration_duration..............: avg=3.5s   min=3.0s   med=3.5s   max=5.0s    p(90)=3.8s   p(95)=4.2s
     iterations......................: 1000     10.0/s
     vus.............................: 100      min=0      max=100
     vus_max..........................: 100      min=100    max=100

 ✓ All thresholds have passed
```

#### **Interpretação:**

| Métrica | Objetivo | Status |
|---------|----------|--------|
| `http_req_duration` p(95) | < 2000ms | ✅ 250ms (OK) |
| `http_req_failed` | < 5% | ✅ 0% (OK) |
| `http_reqs` | > 100/s @ 100 VUs | ✅ 100/s (OK) |
| `vus_max` | = 100 | ✅ 100 (OK) |

---

## 3️⃣ SEGURANÇA DO TESTE: CONFIRMAÇÃO DE ENDPOINTS PROTEGIDOS

### 3.1 Matriz de Rotas: Seguras vs. Perigosas

| Endpoint | Método | Autenticação | IA/Stripe/Clerk | Seguro Testar? | Razão |
|----------|--------|--------------|-----------------|---|------|
| `/api/health` | GET | ❌ Não | ❌ Não | ✅ **SIM** | Apenas BD select count, sem custo |
| `/api/clubs` | GET | ❌ Não | ❌ Não | ✅ **SIM** | Leitura pública, sem autenticação |
| `/api/products` | GET | ❌ Não | ❌ Não | ✅ **SIM** | Leitura pública, sem autenticação |
| `/api/events` | GET | ❌ Não | ❌ Não | ✅ **SIM** | Leitura pública, sem autenticação |
| `/api/matches` | GET | ✅ Sim | ❌ Não | ✅ **SIM** | Leitura BD, sem OpenAI/Stripe |
| `/api/messages` | GET/POST | ✅ Sim | ❌ Não | ✅ **SIM** | Leitura BD, sem APIs externas |
| `/api/quiz` | POST | ✅ Sim | ✅ **OpenAI** | ❌ **NÃO** | ⚠️ Consumiria créditos OpenAI |
| `/api/profile` | PATCH | ✅ Sim | ✅ **OpenAI** | ❌ **NÃO** | ⚠️ Consumiria créditos OpenAI |
| `/api/orders` | POST | ✅ Sim | ✅ **Stripe** | ❌ **NÃO** | ⚠️ Criaria payment intents reais |
| `/api/stripe/checkout` | POST | ✅ Sim | ✅ **Stripe** | ❌ **NÃO** | ⚠️ Criaria checkout sessions reais |
| `/api/webhooks/stripe` | POST | ❌ Não (signature) | ✅ **Stripe** | ❌ **NÃO** | ⚠️ Webhook crítico, poderia corromper dados |
| `/api/webhooks/clerk` | POST | ❌ Não (signature) | ✅ **Clerk** | ❌ **NÃO** | ⚠️ Webhook crítico, poderia criar users fake |
| `/api/admin/csam` | GET | ✅ Admin | ❌ Não | ⚠️ Cuidado | Apenas leitura, mas sensível |
| `/api/connect/onboard` | POST | ✅ Sim | ✅ **Stripe** | ❌ **NÃO** | ⚠️ Criaria Stripe Connect accounts |
| `/api/push/subscribe` | POST | ✅ Sim | ❌ Não | ✅ **SIM** | Apenas BD insert, sem APIs externas |

### 3.2 Explicação: Por Que Não Testar Rotas com IA/Stripe/Clerk?

#### **1. Consumo de Créditos (OpenAI)**
```
Cenário: k6 com 100 VUs durante 30s a chamar /api/quiz
- Cada VU = 1 utilizador
- Se faz 5 requests/s (após ramp-up): 100 VUs × 5 req/s × 30s = 15,000 requests
- Custo por request: ~$0.0005 (gpt-4o-mini)
- Total: 15,000 × $0.0005 = $7.50 em 30 SEGUNDOS ❌

Mesmo com rate limiting (5 req/dia/user):
- Sistema vê 100 VUs como 100 utilizadores diferentes
- Cada um com quota 5 req/dia
- Total: 100 × 5 = 500 requests permitidas = $0.25 por ciclo
- Mas é custo REAL, não teste
```

#### **2. Criação de Payment Intents (Stripe)**
```
Cenário: k6 a chamar /api/orders POST com 100 VUs
- Stripe cria payment intent real para CADA request
- Se 10 requests/VU: 100 × 10 = 1,000 payment intents criados
- Impacto: Contamina dados de teste, webhooks desencadeados
- Risco: Potencial reembolso/disputa se parecer fraude
```

#### **3. Contaminação de Webhooks (Clerk)**
```
Cenário: k6 a simular webhook.user.created
- Vercel recebe 100 user.created events em paralelo
- Middleware Clerk tenta sincronizar 100 users na BD
- Resultado: BD repleta de fake users de teste
- Cleanup: Difícil, pode danificar dados reais

Também:
- /api/webhooks/stripe: Create fake subscriptions
- /api/webhooks/clerk: Create fake user accounts
```

#### **4. Taxa Limiter Como Proteção**
```
Mesmo que quisesses testar /api/quiz com rate limiting:

K6 → Ratelimit: 5 req/24h per user

Problema:
- k6 não envia "user" header (é anónimo ou faz spoofing)
- Rate limiter vê todas as 100 VUs como IP único
- Middleware bloqueia no 1º request (global limit)
- Resultado: Não é teste realista (os teus utilizadores reais não seriam bloqueados)
```

### 3.3 Proteção: Como Garantir Que o Script Não Faz Dano

#### **1. Utilizar Apenas Endpoints de Leitura (GET)**

```javascript
// ✅ SEGURO - Apenas GET
group('Health Check', () => {
  const res = http.get(`${BASE_URL}/api/health`)
  check(res, { 'status 200': (r) => r.status === 200 })
})

// ❌ PERIGOSO - POST que cria dados
group('Create Quiz Result', () => {
  const res = http.post(`${BASE_URL}/api/quiz`, { /* payload */ })
  check(res, { 'status 200': (r) => r.status === 200 })
})
```

#### **2. Blocklist de Rotas Perigosas (CI/CD)**

```bash
# Script de validação antes de correr k6

DANGEROUS_PATTERNS=(
  "/api/quiz"
  "/api/profile"
  "/api/orders"
  "/api/webhooks"
  "/api/connect"
  "/api/stripe"
  "/api/admin"
)

# Verifica se o ficheiro k6 contém algum pattern perigoso
for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if grep -q "$pattern" apps/web/load-tests/*.js; then
    echo "❌ ERRO: Script k6 contém endpoint perigoso: $pattern"
    exit 1
  fi
done

echo "✅ Script k6 validado - apenas rotas seguras"
k6 run apps/web/load-tests/safe-endpoints.js
```

#### **3. Whitelist de Endpoints Permitidos**

```javascript
// Hardcoded whitelist no script

const ALLOWED_ENDPOINTS = [
  '/api/health',
  '/api/clubs',
  '/api/products',
  '/api/events',
  '/api/matches', // Autenticado, mas apenas leitura
  '/api/messages', // Autenticado, mas apenas leitura
]

function validateEndpoint(url) {
  const path = new URL(url).pathname
  if (!ALLOWED_ENDPOINTS.some(ep => path.startsWith(ep))) {
    throw new Error(`❌ Endpoint não permitido para teste de carga: ${path}`)
  }
}

export default function () {
  group('Health', () => {
    const url = `${BASE_URL}/api/health`
    validateEndpoint(url) // Será rejeitado se não na whitelist
    http.get(url)
  })
}
```

#### **4. Verificação Manual Antes de Correr**

**Checklist:**
- [ ] Script contém apenas GET requests?
- [ ] Script NÃO contém `/api/quiz`, `/api/profile`, `/api/orders`?
- [ ] Script NÃO contém `/api/webhooks`, `/api/stripe`, `/api/connect`?
- [ ] URLs testadas são públicas ou leitura autenticada?
- [ ] Nenhum JSON body com dados de teste (quiz answers, payment info)?

---

## 4️⃣ PLANO DE IMPLEMENTAÇÃO (Timeline)

### Fase 1: Preparação (1-2 dias)
- [ ] Criar conta Upstash (free tier)
- [ ] Obter `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- [ ] Adicionar env vars a Vercel production
- [ ] Instalar `@upstash/ratelimit` + `@upstash/redis` no apps/web
- [ ] Criar ficheiro `load-tests/safe-endpoints.js` com script k6

### Fase 2: Teste Local (1 dia)
- [ ] Correr script k6 contra `http://localhost:3000`
- [ ] Validar que health + clubs endpoints respondendo
- [ ] Confirmar que sem erros/429s (sem rate limiting configurado ainda)

### Fase 3: Implementação Rate Limiting (2-3 dias)
- [ ] Adicionar middleware global rate limit (1000 req/min por IP)
- [ ] Adicionar route-level rate limits (/api/quiz: 5/dia, etc.)
- [ ] Testar 429 responses com curl/Postman

### Fase 4: Load Testing em Produção (1 dia)
- [ ] Correr `k6 run --env BASE_URL=https://www.theplayroom.pt apps/web/load-tests/safe-endpoints.js`
- [ ] Validar que p95 latência < 2s com 100 VUs
- [ ] Confirmar que 0% de erros

### Fase 5: Validação e Hardening (1-2 dias)
- [ ] Adicionar CI/CD workflow para rodar testes diários
- [ ] Configurar alertas se latência p95 > 2s ou erro rate > 5%
- [ ] Documentar runbook para alertas

---

## 5️⃣ RESUMO E PRÓXIMAS AÇÕES

### ✅ O Que Foi Planeado:

1. **Rate Limiting Arquitetura**
   - Upstash Redis para armazenamento distribuído
   - Middleware global (1000 req/min por IP)
   - Route-level específicos (5 req/dia para IA)
   - Env vars: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`

2. **Load Testing Script (k6)**
   - 100 VUs durante 30s
   - Apenas endpoints seguros (health, clubs, products, events)
   - Zero impacto em OpenAI/Stripe/Clerk
   - Métricas: p95 latência, taxa de erro

3. **Segurança Garantida**
   - Endpoints perigosos identificados (quiz, orders, webhooks)
   - Whitelist de rotas permitidas
   - Validação automática antes de executar

### 🚀 Próximas Ações (Para Implementação Real):

1. Contactar Upstash, criar DB free tier
2. Implementar `@upstash/ratelimit` em middleware.ts
3. Criar ficheiro k6 em `apps/web/load-tests/safe-endpoints.js`
4. Executar teste local
5. Deploy de rate limiting em produção
6. Correr teste contra produção e validar thresholds

---

**Documento Preparado Por:** Arquiteto de Software  
**Status:** Pronto para Revisão CTO + Implementação Engenharia  
**Próxima Revisão:** Após aprovação do plano
