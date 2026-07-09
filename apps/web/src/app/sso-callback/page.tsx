import { redirect } from 'next/navigation'

interface SsoCallbackPageProps {
  searchParams?: Record<string, string | string[] | undefined>
}

function toQueryString(searchParams?: Record<string, string | string[] | undefined>) {
  if (!searchParams) return ''

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item)
    } else if (typeof value === 'string') {
      params.set(key, value)
    }
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}

export default function SsoCallbackPage({ searchParams }: SsoCallbackPageProps) {
  redirect(`/pt/sso-callback${toQueryString(searchParams)}`)
}