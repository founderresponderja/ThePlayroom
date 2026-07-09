import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function getR2Config() {
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('Cloudflare R2 is not fully configured')
  }

  return {
    endpoint,
    bucket,
    accessKeyId,
    secretAccessKey,
  }
}

function createR2Client() {
  const config = getR2Config()

  return {
    client: new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    }),
    bucket: config.bucket,
  }
}

export function getPublicUrl(key: string) {
  const cdn = process.env.NEXT_PUBLIC_MEDIA_CDN_URL ?? 'https://media.example.invalid'
  return `${cdn}/${key.replace(/^\/+/, '')}`
}

export function getObjectKey(keyOrUrl: string) {
  if (!keyOrUrl.startsWith('http')) return keyOrUrl.replace(/^\/+/, '')

  const url = new URL(keyOrUrl)
  return decodeURIComponent(url.pathname.replace(/^\/+/, ''))
}

export async function getPresignedUploadUrl(key: string, contentType: string) {
  const { client, bucket } = createR2Client()

  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 300 },
  )
}

export async function getObjectBytes(keyOrUrl: string) {
  const key = getObjectKey(keyOrUrl)
  const { client, bucket } = createR2Client()
  const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))

  if (!result.Body || typeof result.Body.transformToByteArray !== 'function') {
    throw new Error('Object body is not readable')
  }

  const bytes = await result.Body.transformToByteArray()
  return Uint8Array.from(bytes).buffer
}

export async function deleteObject(keyOrUrl: string) {
  const key = getObjectKey(keyOrUrl)

  try {
    const { client, bucket } = createR2Client()
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    return { ok: true, skipped: false, key }
  } catch (error) {
    console.error('[R2] Failed to delete object', { key, error })
    return { ok: false, skipped: false, key }
  }
}
