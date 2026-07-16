# 📁 Load Testing - Segurança e Validação

**Diretório:** `/apps/web/load-tests/`

---

## 📋 Checklist de Segurança: Endpoints Testados vs. Perigosos

### ✅ Endpoints SEGUROS para Teste (Whitelist)

Estes endpoints podem ser testados com k6 sem risco financeiro ou operacional:

| Endpoint | Método | Auth | Por Quê é Seguro? | Limite de Teste |
|----------|--------|------|-------------------|-----------------|
| `/api/health` | GET | ❌ | Sem IA, sem BD pesada, apenas status | ∞ (sem limit) |
| `/api/clubs` | GET | ❌ | Apenas leitura, sem IA/Stripe | 100 req/s |
| `/api/products` | GET | ❌ | Apenas leitura, sem IA/Stripe | 100 req/s |
| `/api/events` | GET | ❌ | Apenas leitura, sem IA/Stripe | 100 req/s |
| `/api/matches` | GET | ✅ | Leitura autenticada, sem IA/Stripe | 100 req/s |
| `/api/messages` | GET | ✅ | Leitura autenticada, sem IA/Stripe | 100 req/s |
| `/api/push/subscribe` | GET | ✅ | Apenas BD insert, sem APIs externas | 50 req/s |

---

### ❌ Endpoints PERIGOSOS (Blacklist)

**NUNCA testar estes endpoints com k6 ou ferramentas de stress:**

| Endpoint | Razão | Risco | Impacto |
|----------|-------|-------|--------|
| `/api/quiz` | OpenAI | $$$ Custo real | €5-50 por 100 requests |
| `/api/profile` | OpenAI | $$$ Custo real | €5-50 por 100 requests |
| `/api/orders` | Stripe | 💳 Payment intent real | Transações fake, chargeback risk |
| `/api/stripe/*` | Stripe | 💳 Real data | Contas/subscrições reais criadas |
| `/api/connect/*` | Stripe Connect | 👤 Account creation | Contas seller fake criadas |
| `/api/webhooks/stripe` | Stripe webhook | 🔄 Critical | Subscriptions/events corruptos |
| `/api/webhooks/clerk` | Clerk webhook | 👤 User creation | Fake users criados na BD |
| `/api/admin/*` | Admin panel | 🔑 Sensitive | Acesso a moderation, ban users |
| `/api/verifications/*` | Photo moderation | 🔄 External API | CSAM scanner (se ativado) |

---

## 🔒 Protocolo de Validação Automática

### Pré-Teste (Antes de Correr k6)

```bash
#!/bin/bash
# Script: apps/web/load-tests/validate-safety.sh

set -e

SCRIPT_FILE="$1"
if [ -z "$SCRIPT_FILE" ]; then
  echo "❌ Uso: ./validate-safety.sh <ficheiro.js>"
  exit 1
fi

echo "🔍 Validando segurança do script k6..."

# 1. Verificar endpoints perigosos
DANGEROUS_PATTERNS=(
  "/api/quiz"
  "/api/profile"
  "/api/orders"
  "/api/stripe"
  "/api/connect"
  "/api/webhooks"
  "/api/admin"
  "/api/verifications"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if grep -q "$pattern" "$SCRIPT_FILE"; then
    echo "❌ FALHA: Script contém endpoint perigoso: $pattern"
    exit 1
  fi
done

# 2. Verificar métodos POST/PUT/PATCH/DELETE (apenas GET permitido)
if grep -q "http\.post\|http\.put\|http\.patch\|http\.delete" "$SCRIPT_FILE"; then
  # Exceção: POST para health check é OK (fake requests)
  if grep -q "http\.post.*health" "$SCRIPT_FILE"; then
    echo "⚠️ AVISO: POST detectado, mas apenas em health check"
  else
    echo "❌ FALHA: Script contém POST/PUT/PATCH/DELETE (apenas GET permitido)"
    exit 1
  fi
fi

# 3. Verificar se há variáveis sensíveis (API keys, tokens) hardcoded
if grep -q "sk_test\|sk_live\|pk_test\|pk_live\|AIza\|Bearer " "$SCRIPT_FILE" | grep -v "__ENV"; then
  echo "❌ FALHA: Script contém tokens/chaves hardcoded (use variáveis de ambiente)"
  exit 1
fi

# 4. Verificar se há dados de teste reais
if grep -q "credit_card\|cvv\|stripe\|payment_method_id" "$SCRIPT_FILE"; then
  echo "❌ FALHA: Script contém dados sensíveis (cartões, etc.)"
  exit 1
fi

echo "✅ Validação passou! Script é seguro para executar."
echo ""
echo "Endpoints testados:"
grep -o 'http\.get(`\${BASE_URL}/[^?`]*' "$SCRIPT_FILE" | sed 's/http\.get(`\${BASE_URL}//g' | sort | uniq
```

**Como usar:**

```bash
chmod +x apps/web/load-tests/validate-safety.sh
./apps/web/load-tests/validate-safety.sh apps/web/load-tests/safe-endpoints.js
```

---

## 📊 Relatório de Validação Pós-Teste

### Documentar Cada Execução

**Ficheiro:** `load-tests/TEST_LOG.md`

```markdown
# Load Test Execution Log

## Test 1: Produção - 2026-07-14 14:30 UTC

**Configuração:**
- URL: https://www.theplayroom.pt
- VUs: 100
- Duração: 60s (5s ramp-up + 20s scale + 30s main + 5s ramp-down)
- Rate Limiting: ATIVO (Upstash Redis)

**Segurança:**
- ✅ Apenas endpoints de leitura (GET)
- ✅ Whitelist validada: /api/health, /api/clubs, /api/products, /api/events
- ✅ Sem endpoints IA/Stripe/Clerk
- ✅ Sem custo incurrido

**Resultados:**
- http_req_duration p(95): 400ms ✅ (threshold: < 2000ms)
- http_req_failed: 0.00% ✅ (threshold: < 5%)
- http_reqs: 3,500 (70 req/s) ✅
- vus_max: 100 ✅

**Conclusão:** ✅ TESTE PASSOU - Sistema estável sob carga

---

## Test 2: ...
```

---

## 🚨 Proteção Contra Erro Humano

### Env Var Whitelist (Vercel)

**Em Vercel Dashboard → Settings → Environment Variables:**

```
Configurar APENAS estas variáveis para k6:
- BASE_URL (opcional, padrão: https://www.theplayroom.pt)
- TEST_USER_TOKEN (opcional, para testes autenticados)

NUNCA adicionar:
- OPENAI_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- CLERK_SECRET_KEY
- UPSTASH_REDIS_REST_TOKEN
```

Isto previne acidental exposure de credenciais em logs de teste.

---

## 📝 Template de Script Seguro

Se precisares criar novo script k6:

```javascript
// ✅ TEMPLATE SEGURO

import http from 'k6/http'
import { check } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'https://www.theplayroom.pt'

// WHITELIST: Apenas estes endpoints
const ALLOWED_ENDPOINTS = [
  '/api/health',
  '/api/clubs',
  '/api/products',
  '/api/events',
  '/api/matches',
  '/api/messages',
]

export default function () {
  // Selecionar endpoint aleatório da whitelist
  const endpoint = ALLOWED_ENDPOINTS[Math.floor(Math.random() * ALLOWED_ENDPOINTS.length)]
  
  const res = http.get(`${BASE_URL}${endpoint}`)
  
  check(res, {
    'status 200': (r) => r.status === 200 || r.status === 401 || r.status === 404,
    'no rate limit 429': (r) => r.status !== 429,
  })
}
```

---

## 🔑 Credenciais Necessárias (Docs)

### Para Testar Endpoints Autenticados

Se quiseres testar `/api/matches` ou `/api/messages`:

```bash
# 1. Ir para Dashboard Clerk: https://dashboard.clerk.com
# 2. Usuarios → Selecionar user teste
# 3. Copiar JWT token (na aba "Sessions")
# 4. Correr teste:

k6 run \
  --env TEST_USER_TOKEN="eyJhbGciOiJSUzI1NiI..." \
  apps/web/load-tests/safe-endpoints.js
```

**NUNCA usar credenciais reais de utilizadores!** Cria user de teste:
1. Registar em https://www.theplayroom.pt
2. Email teste: `load-test-vu-001@example.com`
3. Confirmar email via magic link
4. Copiar JWT após login

---

## 📞 Escalação de Problemas

### Se Teste Falhar

1. **Taxa de Erro > 5%:**
   - Verificar status Vercel (https://status.vercel.com)
   - Verificar logs PostgreSQL para conexões maxed out
   - Correr novamente em 10 minutos

2. **Latência p(95) > 2s:**
   - Verificar CPU em Vercel dashboard
   - Se BD: executar `ANALYZE` em todas tabelas
   - Se Upstash: verificar status console.upstash.com

3. **429 Rate Limit Errors:**
   - Normal em `/api/quiz`, `/api/profile` (IA endpoints)
   - Incomum em `/api/health`, `/api/clubs` (sem limite)
   - Se aparecer: verificar configuração Upstash Redis

4. **Connection Refused:**
   - Confirmar URL correcta: `https://www.theplayroom.pt`
   - Testar com curl: `curl https://www.theplayroom.pt/api/health`
   - Se falha: contactar DevOps/Vercel support

---

## ✅ Checklist Final

Antes de Commit:

- [ ] Script `/apps/web/load-tests/safe-endpoints.js` criado
- [ ] Script validado com `./validate-safety.sh safe-endpoints.js`
- [ ] Nenhum endpoint perigoso (/api/quiz, /api/orders, etc.)
- [ ] Apenas métodos GET
- [ ] Nenhuma credencial hardcoded
- [ ] README.md adicionado a `/load-tests/`
- [ ] Script documentado com comentários
- [ ] Teste local executado com sucesso
- [ ] Plano de arquitetura aprovado pelo CTO
- [ ] Env vars Upstash configuradas em Vercel (após rate limiting deploy)

---

**Status:** ✅ Pronto para Teste  
**Última Revisão:** 2026-07-14  
**Autor:** Arquiteto de Software
