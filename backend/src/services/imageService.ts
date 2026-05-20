import type { Env } from '../types'
import sharp from 'sharp'

function generateId(): string {
  return crypto.randomUUID()
}

function getImageDimensions(buffer: ArrayBuffer): { width: number; height: number } | null {
  const view = new DataView(buffer)
  const arr = new Uint8Array(buffer)

  if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) {
    const width = view.getUint32(16)
    const height = view.getUint32(20)
    return { width, height }
  }

  if (arr[0] === 0xFF && arr[1] === 0xD8) {
    let offset = 2
    while (offset < arr.length) {
      if (arr[offset] !== 0xFF) break
      const marker = arr[offset + 1]
      if (marker === 0xC0 || marker === 0xC2) {
        const height = view.getUint16(offset + 5)
        const width = view.getUint16(offset + 7)
        return { width, height }
      }
      const segmentLength = view.getUint16(offset + 2) + 2
      offset += segmentLength
    }
  }

  if (arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46) {
    if (arr[12] === 0x56 && arr[13] === 0x50 && arr[14] === 0x38 && arr[15] === 0x20) {
      const w = view.getUint16(26, true) & 0x3FFF
      const h = view.getUint16(28, true) & 0x3FFF
      return { width: w, height: h }
    }
    if (arr[12] === 0x56 && arr[13] === 0x50 && arr[14] === 0x38 && arr[15] === 0x4C) {
      const bits = view.getUint32(21, true)
      const w = (bits & 0x3FFF) + 1
      const h = ((bits >> 14) & 0x3FFF) + 1
      return { width: w, height: h }
    }
    if (arr[12] === 0x56 && arr[13] === 0x50 && arr[14] === 0x38 && arr[15] === 0x58) {
      const w = view.getUint32(24, true) & 0xFFFFFF
      const h = view.getUint32(27, true) & 0xFFFFFF
      return { width: w + 1, height: h + 1 }
    }
  }

  return null
}

export async function validateAndUploadImage(
  file: File,
  env: Env
): Promise<{ imageKey: string; imageUrl: string; contentType: string }> {
  const buffer = await file.arrayBuffer()

  const dims = getImageDimensions(buffer)
  if (!dims) {
    throw new Error('无法解析图片尺寸，请确保上传有效的 PNG/JPEG/WebP 图片')
  }

  // Compress image: resize to max 1200px width, convert to WebP quality 80
  const compressed = await sharp(Buffer.from(buffer))
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()

  const imageKey = `${generateId()}.webp`
  const metadata = { contentType: 'image/webp' }
  await env.CARD_IMAGES.put(imageKey, compressed, { metadata })

  const imageUrl = `/api/images/${imageKey}`

  return { imageKey, imageUrl, contentType: 'image/webp' }
}

export async function deleteImage(imageKey: string, env: Env): Promise<void> {
  await env.CARD_IMAGES.delete(imageKey)
}

export async function getImage(
  imageKey: string,
  env: Env
): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const { value, metadata } = await env.CARD_IMAGES.getWithMetadata(imageKey, 'arrayBuffer')
  if (!value) return null

  const contentType =
    (metadata as { contentType?: string } | null)?.contentType || 'image/webp'

  return { data: value as ArrayBuffer, contentType }
}
