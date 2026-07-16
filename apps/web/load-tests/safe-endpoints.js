import http from 'k6/http'
import { check, group, sleep } from 'k6'

// ============================================
// CONFIGURAÇÃO DO TESTE
// ============================================
// Ramp-up: 0→10 VUs em 5s
// Scale: 10→100 VUs em 20s
// Sustain: 100 VUs durante 30s (TESTE PRINCIPAL)
// Ramp-down: 100→0 VUs em 5s
//
// Total: 60 segundos de teste
// Métrica crítica: Apenas endpoints de LEITURA (GET)
// Protecção: Nenhum endpoint IA/Stripe/Clerk
// ============================================

export const options = {
  stages: [
    { duration: '5s', target: 10 },   // Ramp-up
    { duration: '20s', target: 100 }, // Scale
    { duration: '30s', target: 100 }, // Main load (TESTE PRINCIPAL - 100 VUs)
    { duration: '5s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    // Fail test se taxa de erro > 5%
    http_req_failed: ['rate<0.05'],
    // Fail test se p95 latência > 2000ms
    http_req_duration: ['p(95)<2000'],
    // Informativo: p99 latência < 3000ms
    'http_req_duration{staticAsset:yes}': ['p(99)<3000'],
  },
  ext: {
    loadimpact: {
      // Para usar com k6 cloud (opcional)
      name: 'ThePlayroom Safe Endpoints Load Test',
      projectID: 0, // Substitui pelo teu project ID se usar k6 cloud
    },
  },
}

// URL base para os testes (pode ser sobrescrita com --env)
const BASE_URL = __ENV.BASE_URL || 'https://www.theplayroom.pt'

// Variável de ambiente opcional para autenticação (Clerk JWT)
// Usar: k6 run --env TEST_USER_TOKEN="..." script.js
const TEST_USER_TOKEN = __ENV.TEST_USER_TOKEN || null

// ============================================
// FUNÇÃO PRINCIPAL DE TESTE
// ============================================
export default function () {
  // Contador local para diversificar requests (évita cache completamente)
  const timestamp = new Date().getTime()
  const vu = __VU // Virtual User ID (0-99)

  // ============================================
  // TESTE 1: GET /api/health
  // ============================================
  // Endpoint: Sem autenticação, sem IA, sem BD pesada
  // Risco: ZERO
  // Por que testar: Simula health checks e monitors externos
  // ============================================
  group('1. Health Check Endpoint', () => {
    const res = http.get(`${BASE_URL}/api/health`)

    check(res, {
      'Health: Status 200': (r) => r.status === 200,
      'Health: Response é JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
      'Health: Status field is "ok"': (r) => r.json('status') === 'ok',
      'Health: Database reachable': (r) => r.json('database.reachable') === true,
      'Health: Sem rate limit (200 not 429)': (r) => r.status !== 429,
    })
  })

  sleep(0.3) // Pausa curta

  // ============================================
  // TESTE 2: GET /api/clubs (Com paginação)
  // ============================================
  // Endpoint: Sem autenticação, apenas leitura BD
  // Risco: ZERO (sem IA, sem Stripe)
  // Por que testar: Simula queries BD com JOINs/filtros
  // ============================================
  group('2. Public Clubs Listing', () => {
    // Varia o page para não cachear completamente
    const page = (vu % 5) + 1
    const limit = 10

    const res = http.get(`${BASE_URL}/api/clubs?page=${page}&limit=${limit}`)

    check(res, {
      'Clubs: Status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'Clubs: Response é JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
      'Clubs: Sem rate limit': (r) => r.status !== 429,
      'Clubs: Resposta válida': (r) => {
        try {
          const body = r.json()
          return true
        } catch {
          return false
        }
      },
    })
  })

  sleep(0.3)

  // ============================================
  // TESTE 3: GET /api/products (Leitura BD)
  // ============================================
  // Endpoint: Sem autenticação, apenas leitura BD
  // Risco: ZERO
  // Por que testar: Simula listagem com filtros
  // ============================================
  group('3. Products Listing', () => {
    const page = (vu % 3) + 1

    const res = http.get(`${BASE_URL}/api/products?page=${page}&limit=20`)

    check(res, {
      'Products: Status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'Products: Sem rate limit': (r) => r.status !== 429,
    })
  })

  sleep(0.3)

  // ============================================
  // TESTE 4: GET /api/events (Leitura BD com filters)
  // ============================================
  // Endpoint: Sem autenticação, apenas leitura BD
  // Risco: ZERO
  // Por que testar: Simula queries com múltiplos filtros
  // ============================================
  group('4. Events Listing', () => {
    const page = (vu % 4) + 1

    const res = http.get(`${BASE_URL}/api/events?page=${page}&limit=10&sortBy=createdAt`)

    check(res, {
      'Events: Status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'Events: Sem rate limit': (r) => r.status !== 429,
    })
  })

  sleep(0.3)

  // ============================================
  // TESTE 5: GET /api/matches (Autenticado - Leitura BD)
  // ============================================
  // Endpoint: Requer autenticação (Clerk), mas apenas LEITURA
  // Risco: BAIXO (sem IA, sem Stripe, apenas BD query)
  // Nota: Se sem TOKEN válido, retorna 401 (esperado)
  // Por que testar: Simula queries BD autenticadas
  // ============================================
  group('5. Authenticated Matches Feed (Read-Only)', () => {
    const params = {
      headers: {
        'Content-Type': 'application/json',
        ...(TEST_USER_TOKEN && { 'Authorization': `Bearer ${TEST_USER_TOKEN}` }),
      },
    }

    const res = http.get(`${BASE_URL}/api/matches?page=1&limit=20`, params)

    check(res, {
      'Matches: Status 200 or 401 or 404': (r) =>
        r.status === 200 || r.status === 401 || r.status === 404,
      'Matches: Sem rate limit 429': (r) => r.status !== 429,
      'Matches: Se autenticado, status 200': (r) =>
        TEST_USER_TOKEN ? r.status === 200 : r.status === 401,
    })
  })

  sleep(0.3)

  // ============================================
  // TESTE 6: GET /api/messages (Autenticado - Leitura BD)
  // ============================================
  // Endpoint: Requer autenticação, mas apenas LEITURA
  // Risco: BAIXO
  // Por que testar: Simula queries de mensagens criptografadas
  // ============================================
  group('6. Authenticated Messages (Read-Only)', () => {
    const params = {
      headers: {
        'Content-Type': 'application/json',
        ...(TEST_USER_TOKEN && { 'Authorization': `Bearer ${TEST_USER_TOKEN}` }),
      },
    }

    const res = http.get(`${BASE_URL}/api/messages?threadId=test&limit=10`, params)

    check(res, {
      'Messages: Status 200, 401, or 404': (r) =>
        r.status === 200 || r.status === 401 || r.status === 404,
      'Messages: Sem rate limit 429': (r) => r.status !== 429,
    })
  })

  sleep(0.5) // Pausa maior antes do próximo ciclo

  // ============================================
  // VERIFICAÇÃO CRÍTICA: Nenhum request a endpoints perigosos
  // ============================================
  // Este é um comentário de audit, não código executável
  //
  // Endpoints BLOQUEADOS neste script:
  // ❌ /api/quiz          → OpenAI (custo $$)
  // ❌ /api/profile       → OpenAI (custo $$)
  // ❌ /api/orders        → Stripe (payment intent real)
  // ❌ /api/stripe/*      → Stripe (dados reais)
  // ❌ /api/connect/*     → Stripe Connect (contas reais)
  // ❌ /api/webhooks/*    → Webhook críticos (contaminação)
  // ❌ /api/admin/*       → Admin endpoints (sensível)
  //
  // Apenas endpoints SEGUROS testados:
  // ✅ /api/health        → Sem IA, sem BD pesada
  // ✅ /api/clubs         → Apenas leitura pública
  // ✅ /api/products      → Apenas leitura pública
  // ✅ /api/events        → Apenas leitura pública
  // ✅ /api/matches       → Leitura autenticada (sem IA)
  // ✅ /api/messages      → Leitura autenticada (sem IA)
  // ============================================
}

// ============================================
// FUNÇÃO DE SETUP (Executada uma vez no início)
// ============================================
export function setup() {
  console.log(`✅ Iniciando teste de carga contra: ${BASE_URL}`)
  console.log(`📊 Cenário: Ramp-up 5s + Scale 20s + Sustain 30s @ 100 VUs`)
  console.log(`🔒 Proteção: Apenas endpoints de leitura (GET)`)
  console.log(`⚠️ Aviso: Nenhuma integração IA/Stripe/Clerk será testada`)

  if (TEST_USER_TOKEN) {
    console.log(`🔐 Token de autenticação fornecido - testes autenticados ativados`)
  } else {
    console.log(`⚠️ Nenhum token fornecido - testes autenticados serão 401s`)
  }

  return {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    hasAuthToken: !!TEST_USER_TOKEN,
  }
}

// ============================================
// FUNÇÃO DE TEARDOWN (Executada uma vez no fim)
// ============================================
export function teardown(data) {
  console.log(`✅ Teste completo às ${new Date().toISOString()}`)
  console.log(`📈 Resultados guardos em summary.json`)
}

// ============================================
// FUNÇÃO DE SUMMARY/REPORT
// ============================================
// Gera relatório em múltiplos formatos
// ============================================
export function handleSummary(data) {
  const summary = {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'json': JSON.stringify(data, null, 2),
    'summary.json': JSON.stringify(data),
  }

  return summary
}

// ============================================
// FUNÇÃO AUXILIAR: Text Summary
// ============================================
function textSummary(data, options = {}) {
  const { indent = '', enableColors = false } = options

  let output = ''

  // Cabeçalho
  output += `\n${indent}=== K6 LOAD TEST SUMMARY ===\n`

  // Métricas principais
  if (data.metrics) {
    const metrics = data.metrics

    if (metrics.http_req_duration?.values?.['p(95)']) {
      output += `${indent}✓ HTTP Duration p(95): ${Math.round(metrics.http_req_duration.values['p(95)'])}ms\n`
    }

    if (metrics.http_req_failed?.values?.rate !== undefined) {
      const rate = (metrics.http_req_failed.values.rate * 100).toFixed(2)
      const status = parseFloat(rate) < 5 ? '✓' : '✗'
      output += `${indent}${status} HTTP Error Rate: ${rate}%\n`
    }

    if (metrics.http_reqs?.value) {
      output += `${indent}✓ Total Requests: ${Math.round(metrics.http_reqs.value)}\n`
    }

    if (metrics.vus_max?.value) {
      output += `${indent}✓ Max VUs: ${Math.round(metrics.vus_max.value)}\n`
    }
  }

  output += `${indent}\n=== END SUMMARY ===\n`

  return output
}
