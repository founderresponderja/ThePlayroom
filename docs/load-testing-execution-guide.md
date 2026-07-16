# 🚀 GUIA DE EXECUÇÃO: Load Testing com k6

**Documento Complementar ao Plano de Arquitetura**

---

## 📋 Quick Start

### 1️⃣ Instalar k6

```bash
# macOS
brew install k6

# Linux (Ubuntu/Debian)
sudo apt-get update && sudo apt-get install -y gnupg2 curl lsb-release
curl https://dl.k6.io/key.gpg | sudo apt-key add -
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Windows (Chocolatey)
choco install k6

# Docker (sem instalar localmente)
docker run -i grafana/k6 run - < apps/web/load-tests/safe-endpoints.js
```

### 2️⃣ Correr Teste Contra Produção

```bash
# Simples - contra www.theplayroom.pt (padrão)
k6 run apps/web/load-tests/safe-endpoints.js

# Com output detalhado
k6 run \
  --env BASE_URL=https://www.theplayroom.pt \
  --out json=results.json \
  apps/web/load-tests/safe-endpoints.js
```

### 3️⃣ Visualizar Resultados

```bash
# Depois de correr, abrir results.json em editor ou Python
python3 << 'EOF'
import json

with open('results.json', 'r') as f:
    data = json.load(f)
    
metrics = data['metrics']

# Extrair métricas principais
duration = metrics.get('http_req_duration', {}).get('values', {})
errors = metrics.get('http_req_failed', {}).get('values', {})

print(f"P95 Latência: {duration.get('p(95)')}ms")
print(f"P99 Latência: {duration.get('p(99)')}ms")
print(f"Taxa de Erro: {errors.get('rate', 0)*100:.2f}%")
EOF
```

---

## 🔍 Cenários de Teste

### Cenário 1: Desenvolvimento Local (Sem Rate Limiting)

```bash
# Terminal 1: Iniciar servidor local
cd apps/web
pnpm dev  # Inicia em http://localhost:3000

# Terminal 2: Correr teste (com timeout curto)
k6 run \
  --env BASE_URL=http://localhost:3000 \
  --duration 30s \
  --vus 10 \
  apps/web/load-tests/safe-endpoints.js
```

**Output esperado:**
```
✓ All thresholds have passed

http_req_duration..................: avg=50ms   min=10ms   max=500ms   p(95)=200ms
http_req_failed....................: 0.00%
http_reqs..........................: 3000     100/s
```

---

### Cenário 2: Staging (Com Rate Limiting Ativado)

```bash
# Assumindo deployado em staging.theplayroom.pt
k6 run \
  --env BASE_URL=https://staging.theplayroom.pt \
  --out json=staging-results.json \
  apps/web/load-tests/safe-endpoints.js
```

**Output esperado:**
```
✓ All thresholds have passed

http_req_duration..................: avg=120ms  min=50ms   max=2000ms  p(95)=400ms
http_req_failed....................: 0.00%
http_reqs..........................: 3500     70/s  (pode ser < 100/s se rate limit global)
```

---

### Cenário 3: Produção (Full Stress Test)

```bash
# Teste completo contra produção com alertas
k6 run \
  --env BASE_URL=https://www.theplayroom.pt \
  --out json=production-results.json \
  --summary-export=production-summary.html \
  apps/web/load-tests/safe-endpoints.js

# Verificar se thresholds passaram
echo "Exit code: $?"  # 0 = passou, 1 = falhou
```

---

### Cenário 4: Teste com Autenticação (Opcional)

Se quiseres testar endpoints autenticados (matches, messages):

```bash
# 1. Obter JWT token de Clerk (manualmente ou via API)
# Exemplo de token (fake): "eyJhbGc..."

# 2. Correr teste com token
k6 run \
  --env BASE_URL=https://www.theplayroom.pt \
  --env TEST_USER_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6Imtm..." \
  apps/web/load-tests/safe-endpoints.js
```

**Output diferença:**
```
✓ Matches: Se autenticado, status 200: [passa se token válido]
✓ Messages: Se autenticado, status 200: [passa se token válido]
```

---

### Cenário 5: Teste em Cloud (Grafana k6 Cloud - Opcional)

```bash
# Fazer login (cria conta em https://app.k6.io)
k6 cloud login

# Correr teste em cloud (com gráficos em tempo real)
k6 cloud run apps/web/load-tests/safe-endpoints.js
```

**Vantagens:**
- ✅ Distribuído geograficamente (múltiplas regiões)
- ✅ Gráficos em tempo real
- ✅ Histórico de testes
- ✅ Integração com Slack/Teams para alertas

---

## 📊 Interpretação de Resultados

### Métricas Críticas

#### 1️⃣ `http_req_duration` (Latência)

```
http_req_duration..................: avg=120ms  min=50ms   max=2000ms   p(95)=400ms  p(99)=1200ms

Interpretação:
- avg: 120ms → Latência média (OK se < 500ms)
- p(95): 400ms → 95% dos requests responderam em < 400ms (OK se < 2000ms)
- p(99): 1200ms → 99% dos requests responderam em < 1200ms (OK se < 3000ms)
- max: 2000ms → Pior request levou 2s (OK se < 10s)

Threshold test: p(95) < 2000ms ✅ PASSOU
```

#### 2️⃣ `http_req_failed` (Taxa de Erro)

```
http_req_failed....................: 0.00%

Interpretação:
- 0.00% → Nenhum erro HTTP (status 5xx) (OK se < 5%)
- Se 2.5% → 2.5% dos requests retornaram erro (AVISO)
- Se 10% → 10% dos requests falharam (FALHA CRÍTICA)

Threshold test: rate < 5% ✅ PASSOU
```

#### 3️⃣ `http_reqs` (Throughput)

```
http_reqs..........................: 3500     70/s

Interpretação:
- 3500: Total de requests no teste
- 70/s: Média de 70 requests/segundo durante o teste
- Com 100 VUs, espera-se ~100/s ou mais
- Se < 50/s → Possivelmente rate limiting ou gargalo BD

Esperado: > 50 req/s ✅ PASSOU
```

#### 4️⃣ `vus_max` (Utilizadores Virtuais Máximos)

```
vus_max............................: 100

Interpretação:
- 100 VUs mantidos conforme configurado
- Se < 100 → Possível crash antes de atingir target
- Se = 100 → Ramp-up completou sem problemas

Esperado: = 100 ✅ PASSOU
```

---

### Checklist de Sucesso ✅

```
Depois de correr k6, verificar:

LATÊNCIA:
☐ http_req_duration p(95) < 2000ms  (threshold do teste)
☐ http_req_duration avg < 500ms     (baseline saudável)
☐ http_req_duration max < 10s       (sem requests presas)

ERROS:
☐ http_req_failed rate < 5%         (threshold do teste)
☐ http_req_failed rate == 0%        (ideal)
☐ Nenhum erro 5xx nos logs

THROUGHPUT:
☐ http_reqs > 50 per second         (mínimo)
☐ http_reqs > 100 per second        (esperado com 100 VUs)
☐ Sem drops em throughput durante o teste

RECURSOS:
☐ Servidor Vercel sem CPU 100%     (verificar em Vercel dashboard)
☐ BD PostgreSQL sem conexões max    (verificar em pg_stat_statements)
☐ Upstash Redis sem timeout         (verificar em console Upstash)

SEGURANÇA:
☐ Nenhum endpoint perigoso testado (/api/quiz, /api/orders, etc.)
☐ Nenhum custo incurrido (OpenAI, Stripe)
☐ Nenhum dado contaminado (fake webhooks, fake users)
```

---

## 🔧 Troubleshooting

### Erro: "Too many open files"

```bash
# Aumentar file descriptor limit
ulimit -n 4096
k6 run apps/web/load-tests/safe-endpoints.js
```

### Erro: "Connection refused" (Localhost)

```bash
# Confirmar que servidor local está a correr
curl http://localhost:3000/api/health

# Se não responder, iniciar em novo terminal:
cd apps/web && pnpm dev
```

### Erro: "Rate limit exceeded" (429s)

```bash
# Se aparecer com 100 VUs:
# - Significa rate limiting já está ativo
# - Esperado para /api/quiz, /api/profile
# - Para health/clubs/products, não deve aparecer

# Verificar thresholds:
# Se > 5% de 429s → Falha (script está com problema)
```

### Latência muito alta (> 5s)

```bash
# 1. Verificar performance em Vercel
curl -w "Time: %{time_total}s\n" https://www.theplayroom.pt/api/health

# 2. Verificar BD
# - SELECT count(*) FROM clubs  (se muito lento)
# - Verificar índices em pgAdmin

# 3. Se usa rate limiting Redis
# - Verificar latência Upstash
# - Pode ser conexão HTTP REST lenta
```

---

## 📈 Métricas Avançadas

### Extrair Latência por Endpoint

```bash
# Depois de correr com --out json=results.json

python3 << 'EOF'
import json
from collections import defaultdict

with open('results.json', 'r') as f:
    lines = f.readlines()

# Parsing de streams k6
endpoints = defaultdict(list)

for line in lines:
    try:
        entry = json.loads(line)
        if entry.get('type') == 'Metric':
            metric = entry['metric']
            if 'http_req_duration' in metric:
                tags = entry.get('data', {}).get('tags', {})
                name = tags.get('name', 'unknown')
                value = entry['data']['value']
                endpoints[name].append(value)
    except:
        pass

# Print summary
for name, latencies in sorted(endpoints.items()):
    if latencies:
        avg = sum(latencies) / len(latencies)
        p95 = sorted(latencies)[int(len(latencies)*0.95)]
        print(f"{name}: avg={avg:.0f}ms, p95={p95:.0f}ms, n={len(latencies)}")
EOF
```

---

## 🔐 Validação de Segurança Antes de Testar

**FAZER ISTO ANTES DE CADA TESTE:**

```bash
# 1. Verificar que apenas endpoints seguros no script
grep -E "(quiz|profile|orders|webhooks|stripe|admin)" \
  apps/web/load-tests/safe-endpoints.js

# Se encontrar algum → PARAR E REMOVE DO SCRIPT

# 2. Confirmar que apenas GETs
grep -c "http\.post\|http\.patch\|http\.put\|http\.delete" \
  apps/web/load-tests/safe-endpoints.js

# Se > 0 → PARAR E REMOVE DO SCRIPT

# 3. Confirmar endpoints em whitelist
echo "✓ Endpoints testados:"
grep -o "http\.get(\`\${BASE_URL}/[^?]*" apps/web/load-tests/safe-endpoints.js | sort | uniq
```

---

## 📋 Checklist de Deploy (Rate Limiting)

Antes de correr teste de stress em produção:

- [ ] Rate limiting implementado em middleware.ts
- [ ] Upstash Redis configurado e testado
- [ ] Env vars `UPSTASH_REDIS_REST_URL` + token em Vercel
- [ ] Todos os limites per-endpoint configurados
- [ ] Teste local de rate limit: `curl -X POST http://localhost:3000/api/quiz` (5x rápido)
- [ ] Confirmação: 6º request retorna 429
- [ ] Load test script validado (sem endpoints perigosos)
- [ ] Alertas configurados no Vercel (CPU, BD connections)
- [ ] Slack/Email alerts para /api/health failure

---

## 📞 Contatos & Recursos

- **k6 Documentação:** https://k6.io/docs/
- **Upstash Rate Limiting:** https://upstash.com/docs/redis/features/ratelimiting
- **Vercel Performance:** https://vercel.com/docs/analytics
- **PostgreSQL Slow Queries:** `SELECT * FROM pg_stat_statements ORDER BY total_time DESC;`

---

**Documento Versão:** 1.0  
**Última Atualização:** 2026-07-14  
**Pronto para Produção:** ✅ SIM (após aprovação do plano)
