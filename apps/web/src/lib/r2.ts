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
