export function getPublicUrl(key: string) {
  const cdn = process.env.NEXT_PUBLIC_MEDIA_CDN_URL ?? 'https://media.example.invalid'
  return `${cdn}/${key.replace(/^\/+/, '')}`
}

export async function getPresignedUploadUrl(key: string, contentType: string) {
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME

  if (!endpoint || !bucket) {
    return `https://example.invalid/${encodeURIComponent(key)}?contentType=${encodeURIComponent(contentType)}`
  }

  return `${endpoint}/${bucket}/${encodeURIComponent(key)}?contentType=${encodeURIComponent(contentType)}`
}

export async function deleteObject(keyOrUrl: string) {
  const key = keyOrUrl.startsWith('http') ? new URL(keyOrUrl).pathname.replace(/^\/+/, '') : keyOrUrl

  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    return { ok: true, skipped: true, key }
  }

  return { ok: true, skipped: false, key }
}
