const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://theplayroom.pt'

export async function apiFetch<T>(
  path: string,
  token: string | null,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  const hasBody = options.body != null
  const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData
  if (hasBody && !isFormDataBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const contentType = res.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')

  if (!res.ok) {
    if (isJson) {
      const error = await res.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error((error as { error: string }).error ?? 'Request failed')
    }
    const textError = await res.text().catch(() => '')
    throw new Error(textError || 'Request failed')
  }

  if (res.status === 204) {
    return undefined as T
  }

  if (isJson) {
    return res.json() as Promise<T>
  }

  return (await res.text()) as T
}