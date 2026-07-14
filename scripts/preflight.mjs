#!/usr/bin/env node

const requiredEnvKeys = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'CLERK_WEBHOOK_SIGNING_SECRET',
  'DATABASE_URL',
  'DIRECT_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_PRICE_FEMALE_SINGLE_MONTHLY',
  'STRIPE_PRICE_FEMALE_SINGLE_ANNUAL',
  'STRIPE_PRICE_MALE_SINGLE_MONTHLY',
  'STRIPE_PRICE_MALE_SINGLE_ANNUAL',
  'STRIPE_PRICE_COUPLE_MONTHLY',
  'STRIPE_PRICE_COUPLE_ANNUAL',
  'STRIPE_PRICE_RESERVATION_MGMT_MONTHLY',
  'STRIPE_PRICE_RESERVATION_MGMT_ANNUAL',
  'CLOUDFLARE_R2_ENDPOINT',
  'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  'CLOUDFLARE_R2_BUCKET_NAME',
  'NEXT_PUBLIC_MEDIA_CDN_URL',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_SUBJECT',
  'MAKE_OPS_WEBHOOK_URL',
  'CSAM_SCANNER_API_KEY',
]

const optionalEnvKeys = [
  'EXPO_ACCESS_TOKEN',
  'ABLY_API_KEY',
  'ADMIN_USER_IDS',
  'NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY',
  'MARKETPLACE_DEFAULT_COMMISSION_BPS',
]

function parseArgs(argv) {
  const args = { baseUrl: '', failFast: true }

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--base-url' && argv[index + 1]) {
      args.baseUrl = argv[index + 1]
      index += 1
      continue
    }
    if (value === '--allow-missing-env') {
      args.failFast = false
    }
  }

  return args
}

function normalizeBaseUrl(input) {
  if (!input) return ''
  try {
    return new URL(input.startsWith('http') ? input : `https://${input}`).toString().replace(/\/$/, '')
  } catch {
    return ''
  }
}

function checkEnv() {
  const missing = requiredEnvKeys.filter((key) => !process.env[key] || !String(process.env[key]).trim())
  const optionalConfigured = optionalEnvKeys.filter((key) => Boolean(process.env[key] && String(process.env[key]).trim()))

  return { missing, optionalConfigured }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    redirect: 'follow',
    ...options,
  })

  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '')

  return { response, body }
}

async function main() {
  const args = parseArgs(process.argv)
  const envCheck = checkEnv()
  const baseUrl = normalizeBaseUrl(args.baseUrl || process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL)

  console.log('Preflight: starting checks')

  if (envCheck.missing.length > 0) {
    console.error('Missing required environment keys:')
    for (const key of envCheck.missing) {
      console.error(`- ${key}`)
    }
    if (args.failFast) {
      process.exitCode = 1
      return
    }
  }

  if (!baseUrl) {
    console.error('No valid base URL found. Pass --base-url or set NEXT_PUBLIC_APP_URL / VERCEL_URL.')
    process.exitCode = 1
    return
  }

  console.log(`Base URL: ${baseUrl}`)

  const results = []

  try {
    const healthUrl = new URL('/api/health', baseUrl).toString()
    const { response: healthResponse, body: healthBody } = await fetchJson(healthUrl)
    const ok = healthResponse.ok && healthBody && typeof healthBody === 'object' && healthBody.status === 'ok'
    results.push({ name: 'health', ok, status: healthResponse.status })
    if (!ok) {
      throw new Error(`Health check failed with status ${healthResponse.status}`)
    }
  } catch (error) {
    results.push({ name: 'health', ok: false, error: error instanceof Error ? error.message : String(error) })
  }

  const pageChecks = [
    ['/', 307],
    ['/pt', 200],
    ['/pt/sign-in', 200],
    ['/pt/dashboard', 200],
  ]

  for (const [path, expectedStatus] of pageChecks) {
    try {
      const url = new URL(path, baseUrl).toString()
      const response = await fetch(url, { redirect: 'manual' })
      const ok =
        (path === '/' && (response.status === 307 || response.status === 308)) ||
        (path === '/pt' && response.status >= 200 && response.status < 400) ||
        response.status === expectedStatus
      results.push({ name: path, ok, status: response.status })
      if (!ok) {
        throw new Error(`${path} returned ${response.status}, expected ${expectedStatus}`)
      }
    } catch (error) {
      results.push({ name: path, ok: false, error: error instanceof Error ? error.message : String(error) })
    }
  }

  const failed = results.filter((item) => !item.ok)

  console.log('Preflight results:')
  for (const result of results) {
    const suffix = result.ok ? 'ok' : `failed${result.error ? ` - ${result.error}` : ''}`
    console.log(`- ${result.name}: ${suffix}`)
  }

  if (envCheck.optionalConfigured.length > 0) {
    console.log('Optional env keys configured:')
    for (const key of envCheck.optionalConfigured) {
      console.log(`- ${key}`)
    }
  }

  if (failed.length > 0 || (args.failFast && envCheck.missing.length > 0)) {
    process.exitCode = 1
    return
  }

  console.log('Preflight passed')
}

main().catch((error) => {
  console.error('Preflight crashed:', error)
  process.exitCode = 1
})